import { allItemsHaveSameType, getTypeOf, toPascalCase } from '@/lib/utils';
import { JSONValue } from '@/types/json';

// Helper to sanitize property names for Python
function sanitizePropertyName(name: string): string {
  // Handle property names that are not valid identifiers
  if (
    /^[0-9]/.test(name) ||
    /[^a-zA-Z0-9_]/.test(name) ||
    /^(and|as|assert|break|class|continue|def|del|elif|else|except|False|finally|for|from|global|if|import|in|is|lambda|None|nonlocal|not|or|pass|raise|return|True|try|while|with|yield)$/.test(
      name,
    )
  ) {
    return `"${name}"`;
  }
  return name;
}

// Generate Python classes from JSON
export function jsonToPython(
  json: JSONValue,
  rootTypeName = 'RootType',
): string {
  const classMap = new Map<string, string>();
  const processedClasses = new Set<string>();
  const imports = new Set<string>();

  imports.add('from dataclasses import dataclass');
  imports.add('from typing import List, Dict, Any, Optional, Union');

  function processValue(value: JSONValue, className: string): string {
    if (processedClasses.has(className)) {
      return className;
    }

    processedClasses.add(className);

    if (value === null) {
      return 'None';
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return 'List[Any]';
      }

      if (allItemsHaveSameType(value)) {
        const itemType = getTypeOf(value[0]);

        if (itemType === 'object') {
          const itemClassName = `${className}Item`;
          processValue(value[0], itemClassName);
          return `List[${itemClassName}]`;
        } else if (itemType === 'array') {
          const nestedItemClassName = `${className}NestedItem`;
          const nestedItemType = processValue(value[0], nestedItemClassName);
          return `List[${nestedItemType}]`;
        } else if (itemType === 'string') {
          return 'List[str]';
        } else if (itemType === 'number') {
          // Check if all numbers are integers
          const allIntegers = value.every((num) => Number.isInteger(num));
          return allIntegers ? 'List[int]' : 'List[float]';
        } else if (itemType === 'boolean') {
          return 'List[bool]';
        } else {
          return 'List[Any]';
        }
      } else {
        // Mixed types in array
        return 'List[Any]';
      }
    }

    if (typeof value === 'object') {
      const fields: string[] = [];
      const initParams: string[] = [];

      for (const [key, propValue] of Object.entries(value)) {
        const propType = getTypeOf(propValue);
        const sanitizedKey = sanitizePropertyName(key);

        if (propType === 'object') {
          const propClassName = `${className}${toPascalCase(key)}`;
          processValue(propValue, propClassName);
          fields.push(`    ${sanitizedKey}: ${propClassName}`);
        } else if (propType === 'array') {
          const arrayClassName = `${className}${toPascalCase(key)}`;
          const arrayType = processValue(propValue, arrayClassName);
          fields.push(`    ${sanitizedKey}: ${arrayType}`);
        } else if (propType === 'string') {
          fields.push(`    ${sanitizedKey}: str`);
        } else if (propType === 'number') {
          // Check if the number is an integer
          const isInteger = Number.isInteger(propValue);
          fields.push(`    ${sanitizedKey}: ${isInteger ? 'int' : 'float'}`);
        } else if (propType === 'boolean') {
          fields.push(`    ${sanitizedKey}: bool`);
        } else if (propType === 'null') {
          fields.push(`    ${sanitizedKey}: None = None`);
        } else {
          fields.push(`    ${sanitizedKey}: Any`);
        }

        initParams.push(`        self.${sanitizedKey} = ${sanitizedKey}`);
      }

      const classDefinition = `@dataclass\nclass ${className}:\n${fields.join('\n')}`;
      classMap.set(className, classDefinition);

      return className;
    }

    if (typeof value === 'string') {
      return 'str';
    }

    if (typeof value === 'number') {
      return Number.isInteger(value) ? 'int' : 'float';
    }

    if (typeof value === 'boolean') {
      return 'bool';
    }

    return 'Any';
  }

  processValue(json, rootTypeName);

  // Build the final output with all classes
  const classes: string[] = [];

  // Add imports
  classes.push([...imports].join('\n'));
  classes.push('');

  // Add classes in reverse order (dependencies first)
  Array.from(classMap.entries())
    .reverse()
    .forEach(([, definition]) => {
      classes.push(definition);
      classes.push('');
    });

  // Add example usage
  classes.push(`# Example usage:`);
  classes.push(`# import json`);
  classes.push(`# from dacite import from_dict`);
  classes.push(`# `);
  classes.push(`# json_data = '${JSON.stringify(json).replace(/'/g, "\\'")}'`);
  classes.push(`# data_dict = json.loads(json_data)`);
  classes.push(
    `# ${rootTypeName.toLowerCase()} = from_dict(data_class=${rootTypeName}, data=data_dict)`,
  );

  return classes.join('\n');
}
