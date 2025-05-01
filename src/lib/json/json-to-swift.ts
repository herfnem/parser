import type { JSONValue } from '@/types/json';
import {
  allItemsHaveSameType,
  getTypeOf,
  toCamelCase,
  toPascalCase,
} from '@/lib/utils';

// Helper to sanitize property names for Swift
function sanitizePropertyName(name: string): string {
  // Swift keywords to avoid
  const swiftKeywords = [
    'associatedtype',
    'class',
    'deinit',
    'enum',
    'extension',
    'fileprivate',
    'func',
    'import',
    'init',
    'inout',
    'internal',
    'let',
    'open',
    'operator',
    'private',
    'protocol',
    'public',
    'rethrows',
    'static',
    'struct',
    'subscript',
    'typealias',
    'var',
    'break',
    'case',
    'continue',
    'default',
    'defer',
    'do',
    'else',
    'fallthrough',
    'for',
    'guard',
    'if',
    'in',
    'repeat',
    'return',
    'switch',
    'where',
    'while',
    'as',
    'Any',
    'catch',
    'false',
    'is',
    'nil',
    'super',
    'self',
    'Self',
    'throw',
    'throws',
    'true',
    'try',
  ];

  if (
    swiftKeywords.includes(name) ||
    /^[0-9]/.test(name) ||
    /[^a-zA-Z0-9_]/.test(name)
  ) {
    return `\`${name}\``;
  }
  return name;
}

// Generate Swift structs from JSON
export function jsonToSwift(
  json: JSONValue,
  rootTypeName = 'RootType',
): string {
  const structMap = new Map<string, string>();
  const processedStructs = new Set<string>();

  function processValue(value: JSONValue, structName: string): string {
    if (processedStructs.has(structName)) {
      return structName;
    }

    processedStructs.add(structName);

    if (value === null) {
      return 'Any?';
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return '[Any]';
      }

      if (allItemsHaveSameType(value)) {
        const itemType = getTypeOf(value[0]);

        if (itemType === 'object') {
          const itemStructName = `${structName}Item`;
          processValue(value[0], itemStructName);
          return `[${itemStructName}]`;
        } else if (itemType === 'array') {
          const nestedItemStructName = `${structName}NestedItem`;
          const nestedItemType = processValue(value[0], nestedItemStructName);
          return `[${nestedItemType}]`;
        } else if (itemType === 'string') {
          return '[String]';
        } else if (itemType === 'number') {
          // Check if all numbers are integers
          const allIntegers = value.every((num) => Number.isInteger(num));
          return allIntegers ? '[Int]' : '[Double]';
        } else if (itemType === 'boolean') {
          return '[Bool]';
        } else {
          return '[Any]';
        }
      } else {
        // Mixed types in array
        return '[Any]';
      }
    }

    if (typeof value === 'object') {
      const properties: string[] = [];
      const codingKeys: string[] = [];
      // const initParams: string[] = [];

      for (const [key, propValue] of Object.entries(value)) {
        const propType = getTypeOf(propValue);
        const sanitizedKey = sanitizePropertyName(key);
        const camelCaseKey = toCamelCase(key);

        // Add to codingKeys if the property name is different from the JSON key
        if (camelCaseKey !== key) {
          codingKeys.push(`        case ${camelCaseKey} = "${sanitizedKey}"`);
        }

        if (propType === 'object') {
          const propStructName = `${structName}${toPascalCase(key)}`;
          processValue(propValue, propStructName);
          properties.push(`    let ${camelCaseKey}: ${propStructName}`);
        } else if (propType === 'array') {
          const arrayStructName = `${structName}${toPascalCase(key)}`;
          const arrayType = processValue(propValue, arrayStructName);
          properties.push(`    let ${camelCaseKey}: ${arrayType}`);
        } else if (propType === 'string') {
          properties.push(`    let ${camelCaseKey}: String`);
        } else if (propType === 'number') {
          // Check if the number is an integer
          const isInteger = Number.isInteger(propValue);
          properties.push(
            `    let ${camelCaseKey}: ${isInteger ? 'Int' : 'Double'}`,
          );
        } else if (propType === 'boolean') {
          properties.push(`    let ${camelCaseKey}: Bool`);
        } else if (propType === 'null') {
          properties.push(`    let ${camelCaseKey}: Any?`);
        } else {
          properties.push(`    let ${camelCaseKey}: Any`);
        }
      }

      let structDefinition = `struct ${structName}: Codable {\n${properties.join('\n')}`;

      // Add CodingKeys enum if needed
      if (codingKeys.length > 0) {
        structDefinition += `\n\n    enum CodingKeys: String, CodingKey {\n${codingKeys.join('\n')}\n    }`;
      }

      structDefinition += '\n}';
      structMap.set(structName, structDefinition);

      return structName;
    }

    if (typeof value === 'string') {
      return 'String';
    }

    if (typeof value === 'number') {
      return Number.isInteger(value) ? 'Int' : 'Double';
    }

    if (typeof value === 'boolean') {
      return 'Bool';
    }

    return 'Any';
  }

  processValue(json, rootTypeName);

  // Build the final output with all structs
  const structs: string[] = [];

  // Add imports
  structs.push('import Foundation');
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
  structs.push('// let jsonData = jsonString.data(using: .utf8)!');
  structs.push(
    `// let ${toCamelCase(rootTypeName)} = try? JSONDecoder().decode(${rootTypeName}.self, from: jsonData)`,
  );

  return structs.join('\n');
}
