import { allItemsHaveSameType, getTypeOf, toPascalCase } from '@/lib/utils';
import { JSONValue } from '@/types/json';

// Helper to sanitize property names for Go
function sanitizePropertyName(name: string): string {
  // Go keywords to avoid
  const goKeywords = [
    'break',
    'default',
    'func',
    'interface',
    'select',
    'case',
    'defer',
    'go',
    'map',
    'struct',
    'chan',
    'else',
    'goto',
    'package',
    'switch',
    'const',
    'fallthrough',
    'if',
    'range',
    'type',
    'continue',
    'for',
    'import',
    'return',
    'var',
  ];

  if (goKeywords.includes(name)) {
    return name + '_';
  }
  return name;
}

// Generate Go structs from JSON
export function jsonToGo(json: JSONValue, rootTypeName = 'RootType'): string {
  const structMap = new Map<string, string>();
  const processedStructs = new Set<string>();
  const imports = new Set<string>();

  function processValue(value: JSONValue, structName: string): string {
    if (processedStructs.has(structName)) {
      return structName;
    }

    processedStructs.add(structName);

    if (value === null) {
      return 'interface{}';
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return '[]interface{}';
      }

      if (allItemsHaveSameType(value)) {
        const itemType = getTypeOf(value[0]);

        if (itemType === 'object') {
          const itemStructName = `${structName}Item`;
          processValue(value[0], itemStructName);
          return `[]${itemStructName}`;
        } else if (itemType === 'array') {
          const nestedItemStructName = `${structName}NestedItem`;
          const nestedItemType = processValue(value[0], nestedItemStructName);
          return `[]${nestedItemType}`;
        } else if (itemType === 'string') {
          return '[]string';
        } else if (itemType === 'number') {
          // Check if all numbers are integers
          const allIntegers = value.every((num) => Number.isInteger(num));
          return allIntegers ? '[]int' : '[]float64';
        } else if (itemType === 'boolean') {
          return '[]bool';
        } else {
          return '[]interface{}';
        }
      } else {
        // Mixed types in array
        return '[]interface{}';
      }
    }

    if (typeof value === 'object') {
      const fields: string[] = [];

      for (const [key, propValue] of Object.entries(value)) {
        const propType = getTypeOf(propValue);
        const sanitizedKey = sanitizePropertyName(key);
        const pascalCaseKey = toPascalCase(sanitizedKey);

        // Add json tag
        const jsonTag = `\`json:"${key}"\``;

        if (propType === 'object') {
          const propStructName = `${structName}${pascalCaseKey}`;
          processValue(propValue, propStructName);
          fields.push(`\t${pascalCaseKey} ${propStructName} ${jsonTag}`);
        } else if (propType === 'array') {
          const arrayStructName = `${structName}${pascalCaseKey}`;
          const arrayType = processValue(propValue, arrayStructName);
          fields.push(`\t${pascalCaseKey} ${arrayType} ${jsonTag}`);
        } else if (propType === 'string') {
          fields.push(`\t${pascalCaseKey} string ${jsonTag}`);
        } else if (propType === 'number') {
          // Check if the number is an integer
          const isInteger = Number.isInteger(propValue);
          fields.push(
            `\t${pascalCaseKey} ${isInteger ? 'int' : 'float64'} ${jsonTag}`,
          );
        } else if (propType === 'boolean') {
          fields.push(`\t${pascalCaseKey} bool ${jsonTag}`);
        } else if (propType === 'null') {
          fields.push(`\t${pascalCaseKey} interface{} ${jsonTag}`);
        } else {
          fields.push(`\t${pascalCaseKey} interface{} ${jsonTag}`);
        }
      }

      // Build struct definition
      const structDefinition = `type ${structName} struct {\n${fields.join('\n')}\n}`;
      structMap.set(structName, structDefinition);

      return structName;
    }

    if (typeof value === 'string') {
      return 'string';
    }

    if (typeof value === 'number') {
      return Number.isInteger(value) ? 'int' : 'float64';
    }

    if (typeof value === 'boolean') {
      return 'bool';
    }

    return 'interface{}';
  }

  processValue(json, rootTypeName);

  // Build the final output with all structs
  const structs: string[] = [];

  // Add package declaration
  structs.push('package main');
  structs.push('');

  // Add imports if needed
  if (imports.size > 0) {
    structs.push('import (');
    imports.forEach((imp) => {
      structs.push(`\t"${imp}"`);
    });
    structs.push(')');
    structs.push('');
  }

  // Add structs in reverse order (dependencies first)
  Array.from(structMap.entries())
    .reverse()
    .forEach(([, definition]) => {
      structs.push(definition);
      structs.push('');
    });

  // Add example usage
  structs.push('// Example usage:');
  structs.push('// import "encoding/json"');
  structs.push('// ');
  structs.push(`// var ${rootTypeName.toLowerCase()} ${rootTypeName}`);
  structs.push('// err := json.Unmarshal([]byte(jsonData), &data)');
  structs.push('// if err != nil {');
  structs.push('//     fmt.Println(err)');
  structs.push('// }');

  return structs.join('\n');
}
