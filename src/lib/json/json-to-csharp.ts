import { allItemsHaveSameType, getTypeOf, toPascalCase } from '@/lib/utils';
import { JSONValue } from '@/types/json';

// Helper to sanitize property names for C#
function sanitizePropertyName(name: string): string {
  // C# keywords to avoid
  const csharpKeywords = [
    'abstract',
    'as',
    'base',
    'bool',
    'break',
    'byte',
    'case',
    'catch',
    'char',
    'checked',
    'class',
    'const',
    'continue',
    'decimal',
    'default',
    'delegate',
    'do',
    'double',
    'else',
    'enum',
    'event',
    'explicit',
    'extern',
    'false',
    'finally',
    'fixed',
    'float',
    'for',
    'foreach',
    'goto',
    'if',
    'implicit',
    'in',
    'int',
    'interface',
    'internal',
    'is',
    'lock',
    'long',
    'namespace',
    'new',
    'null',
    'object',
    'operator',
    'out',
    'override',
    'params',
    'private',
    'protected',
    'public',
    'readonly',
    'ref',
    'return',
    'sbyte',
    'sealed',
    'short',
    'sizeof',
    'stackalloc',
    'static',
    'string',
    'struct',
    'switch',
    'this',
    'throw',
    'true',
    'try',
    'typeof',
    'uint',
    'ulong',
    'unchecked',
    'unsafe',
    'ushort',
    'using',
    'virtual',
    'void',
    'volatile',
    'while',
  ];

  if (csharpKeywords.includes(name)) {
    return `@${name}`;
  }
  return name;
}

// Generate C# classes from JSON
export function jsonToCSharp(
  json: JSONValue,
  rootTypeName = 'RootType',
): string {
  const classMap = new Map<string, string>();
  const processedClasses = new Set<string>();
  const namespaces = new Set<string>();

  namespaces.add('using System;');
  namespaces.add('using System.Collections.Generic;');
  namespaces.add('using System.Text.Json.Serialization;');

  function processValue(value: JSONValue, className: string): string {
    if (processedClasses.has(className)) {
      return className;
    }

    processedClasses.add(className);

    if (value === null) {
      return 'object';
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return 'List<object>';
      }

      if (allItemsHaveSameType(value)) {
        const itemType = getTypeOf(value[0]);

        if (itemType === 'object') {
          const itemClassName = `${className}Item`;
          processValue(value[0], itemClassName);
          return `List<${itemClassName}>`;
        } else if (itemType === 'array') {
          const nestedItemClassName = `${className}NestedItem`;
          const nestedItemType = processValue(value[0], nestedItemClassName);
          return `List<${nestedItemType}>`;
        } else if (itemType === 'string') {
          return 'List<string>';
        } else if (itemType === 'number') {
          // Check if all numbers are integers
          const allIntegers = value.every((num) => Number.isInteger(num));
          return allIntegers ? 'List<int>' : 'List<double>';
        } else if (itemType === 'boolean') {
          return 'List<bool>';
        } else {
          return 'List<object>';
        }
      } else {
        // Mixed types in array
        return 'List<object>';
      }
    }

    if (typeof value === 'object') {
      const properties: string[] = [];

      for (const [key, propValue] of Object.entries(value)) {
        const propType = getTypeOf(propValue);
        const sanitizedKey = sanitizePropertyName(key);
        const pascalCaseKey = toPascalCase(key);

        // Add JsonPropertyName attribute if the property name is different from the JSON key
        const jsonPropertyAttribute =
          pascalCaseKey !== key
            ? `    [JsonPropertyName("${sanitizedKey}")]\n`
            : '';

        if (propType === 'object') {
          const propClassName = `${className}${pascalCaseKey}`;
          processValue(propValue, propClassName);
          properties.push(
            `${jsonPropertyAttribute}    public ${propClassName} ${pascalCaseKey} { get; set; }`,
          );
        } else if (propType === 'array') {
          const arrayClassName = `${className}${pascalCaseKey}`;
          const arrayType = processValue(propValue, arrayClassName);
          properties.push(
            `${jsonPropertyAttribute}    public ${arrayType} ${pascalCaseKey} { get; set; }`,
          );
        } else if (propType === 'string') {
          properties.push(
            `${jsonPropertyAttribute}    public string ${pascalCaseKey} { get; set; }`,
          );
        } else if (propType === 'number') {
          // Check if the number is an integer
          const isInteger = Number.isInteger(propValue);
          properties.push(
            `${jsonPropertyAttribute}    public ${isInteger ? 'int' : 'double'} ${pascalCaseKey} { get; set; }`,
          );
        } else if (propType === 'boolean') {
          properties.push(
            `${jsonPropertyAttribute}    public bool ${pascalCaseKey} { get; set; }`,
          );
        } else if (propType === 'null') {
          properties.push(
            `${jsonPropertyAttribute}    public object ${pascalCaseKey} { get; set; }`,
          );
        } else {
          properties.push(
            `${jsonPropertyAttribute}    public object ${pascalCaseKey} { get; set; }`,
          );
        }
      }

      // Build class definition
      let classDefinition = `public class ${className}\n{\n`;

      // Add properties
      classDefinition += properties.join('\n');

      // Close class
      classDefinition += '\n}';

      classMap.set(className, classDefinition);

      return className;
    }

    if (typeof value === 'string') {
      return 'string';
    }

    if (typeof value === 'number') {
      return Number.isInteger(value) ? 'int' : 'double';
    }

    if (typeof value === 'boolean') {
      return 'bool';
    }

    return 'object';
  }

  processValue(json, rootTypeName);

  // Build the final output with all classes
  const classes: string[] = [];

  // Add namespaces
  classes.push([...namespaces].join('\n'));
  classes.push('');

  // Add namespace wrapper
  classes.push('namespace JsonModels');
  classes.push('{');

  // Add classes in reverse order (dependencies first)
  Array.from(classMap.entries())
    .reverse()
    .forEach(([, definition]) => {
      classes.push(definition);
      classes.push('');
    });

  // Close namespace
  classes.push('}');

  // Add example usage
  classes.push('');
  classes.push('// Example usage:');
  classes.push('// using System.Text.Json;');
  classes.push(
    `// ${rootTypeName} ${rootTypeName.charAt(0).toLowerCase() + rootTypeName.slice(1)} = JsonSerializer.Deserialize<${rootTypeName}>(jsonString);`,
  );

  return classes.join('\n');
}
