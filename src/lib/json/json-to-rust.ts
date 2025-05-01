import {
  allItemsHaveSameType,
  getTypeOf,
  toPascalCase,
  toSnakeCase,
} from '@/lib/utils';
import type { JSONValue } from '@/types/json';

// Helper to sanitize property names for Rust
function sanitizePropertyName(name: string): string {
  // Rust keywords to avoid
  const rustKeywords = [
    'as',
    'break',
    'const',
    'continue',
    'crate',
    'else',
    'enum',
    'extern',
    'false',
    'fn',
    'for',
    'if',
    'impl',
    'in',
    'let',
    'loop',
    'match',
    'mod',
    'move',
    'mut',
    'pub',
    'ref',
    'return',
    'self',
    'Self',
    'static',
    'struct',
    'super',
    'trait',
    'true',
    'type',
    'unsafe',
    'use',
    'where',
    'while',
    'async',
    'await',
    'dyn',
    'abstract',
    'become',
    'box',
    'do',
    'final',
    'macro',
    'override',
    'priv',
    'typeof',
    'unsized',
    'virtual',
    'yield',
    'try',
  ];

  const snakeCaseName = toSnakeCase(name);
  if (rustKeywords.includes(snakeCaseName)) {
    return `r#${snakeCaseName}`;
  }
  return snakeCaseName;
}

// Generate Rust structs from JSON
export function jsonToRust(json: JSONValue, rootTypeName = 'RootType'): string {
  const structMap = new Map<string, string>();
  const processedStructs = new Set<string>();
  const imports = new Set<string>();

  imports.add('use serde::{Deserialize, Serialize};');

  function processValue(value: JSONValue, structName: string): string {
    if (processedStructs.has(structName)) {
      return structName;
    }

    processedStructs.add(structName);

    if (value === null) {
      return 'Option<()>';
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return 'Vec<serde_json::Value>';
      }

      if (allItemsHaveSameType(value)) {
        const itemType = getTypeOf(value[0]);

        if (itemType === 'object') {
          const itemStructName = `${structName}Item`;
          processValue(value[0], itemStructName);
          return `Vec<${itemStructName}>`;
        } else if (itemType === 'array') {
          const nestedItemStructName = `${structName}NestedItem`;
          const nestedItemType = processValue(value[0], nestedItemStructName);
          return `Vec<${nestedItemType}>`;
        } else if (itemType === 'string') {
          return 'Vec<String>';
        } else if (itemType === 'number') {
          // Check if all numbers are integers
          const allIntegers = value.every((num) => Number.isInteger(num));
          return allIntegers ? 'Vec<i64>' : 'Vec<f64>';
        } else if (itemType === 'boolean') {
          return 'Vec<bool>';
        } else {
          return 'Vec<serde_json::Value>';
        }
      } else {
        // Mixed types in array
        return 'Vec<serde_json::Value>';
      }
    }

    if (typeof value === 'object') {
      const fields: string[] = [];

      for (const [key, propValue] of Object.entries(value)) {
        const propType = getTypeOf(propValue);
        const sanitizedKey = sanitizePropertyName(key);
        const pascalCaseKey = toPascalCase(key);

        // Add serde rename attribute if the property name is different from the JSON key
        const serdeRename =
          sanitizedKey !== key ? `    #[serde(rename = "${key}")]\n` : '';

        if (propType === 'object') {
          const propStructName = `${structName}${pascalCaseKey}`;
          processValue(propValue, propStructName);
          fields.push(
            `${serdeRename}    pub ${sanitizedKey}: ${propStructName},`,
          );
        } else if (propType === 'array') {
          const arrayStructName = `${structName}${pascalCaseKey}`;
          const arrayType = processValue(propValue, arrayStructName);
          fields.push(`${serdeRename}    pub ${sanitizedKey}: ${arrayType},`);
        } else if (propType === 'string') {
          fields.push(`${serdeRename}    pub ${sanitizedKey}: String,`);
        } else if (propType === 'number') {
          // Check if the number is an integer
          const isInteger = Number.isInteger(propValue);
          fields.push(
            `${serdeRename}    pub ${sanitizedKey}: ${isInteger ? 'i64' : 'f64'},`,
          );
        } else if (propType === 'boolean') {
          fields.push(`${serdeRename}    pub ${sanitizedKey}: bool,`);
        } else if (propType === 'null') {
          fields.push(
            `${serdeRename}    pub ${sanitizedKey}: Option<serde_json::Value>,`,
          );
        } else {
          fields.push(
            `${serdeRename}    pub ${sanitizedKey}: serde_json::Value,`,
          );
        }
      }

      // Build struct definition
      const structDefinition = `#[derive(Debug, Serialize, Deserialize)]\npub struct ${structName} {\n${fields.join('\n')}\n}`;
      structMap.set(structName, structDefinition);

      return structName;
    }

    if (typeof value === 'string') {
      return 'String';
    }

    if (typeof value === 'number') {
      return Number.isInteger(value) ? 'i64' : 'f64';
    }

    if (typeof value === 'boolean') {
      return 'bool';
    }

    return 'serde_json::Value';
  }

  processValue(json, rootTypeName);

  // Build the final output with all structs
  const structs: string[] = [];

  // Add imports
  structs.push([...imports].join('\n'));
  structs.push('');

  // Add structs in reverse order (dependencies first)
  Array.from(structMap.entries())
    .reverse()
    .forEach(([, definition]) => {
      structs.push(definition);
      structs.push('');
    });

  // Add example usage
  structs.push('// Example usage:');
  structs.push('// use serde_json;');
  structs.push('// ');
  structs.push(
    `// let ${rootTypeName.toLowerCase()}: ${rootTypeName} = serde_json::from_str(json_str).unwrap();`,
  );

  return structs.join('\n');
}
