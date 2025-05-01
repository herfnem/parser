import {
  allItemsHaveSameType,
  getTypeOf,
  sanitizePropertyName,
  toPascalCase,
} from '@/lib/utils';
import { JSONValue } from '@/types/json';

// Generate Zod schema from JSON
export function jsonToZodSchema(
  json: JSONValue,
  rootTypeName = 'RootType',
): string {
  const schemaMap = new Map<string, string>();
  const processedSchemas = new Set<string>();

  function processValue(value: JSONValue, schemaName: string): string {
    if (processedSchemas.has(schemaName)) {
      return schemaName;
    }

    processedSchemas.add(schemaName);

    if (value === null) {
      return 'z.null()';
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return 'z.array(z.any())';
      }

      if (allItemsHaveSameType(value)) {
        const itemType = getTypeOf(value[0]);

        if (itemType === 'object') {
          const itemSchemaName = `${schemaName}Item`;
          return `z.array(${itemSchemaName})`;
        } else if (itemType === 'array') {
          const nestedItemSchemaName = `${schemaName}NestedItem`;
          const nestedItemSchema = processValue(value[0], nestedItemSchemaName);
          return `z.array(${nestedItemSchema})`;
        } else if (itemType === 'string') {
          return 'z.array(z.string())';
        } else if (itemType === 'number') {
          return 'z.array(z.number())';
        } else if (itemType === 'boolean') {
          return 'z.array(z.boolean())';
        } else {
          return 'z.array(z.any())';
        }
      } else {
        // Mixed types in array
        const itemSchemas = value.map((item, index) => {
          const itemSchemaName = `${schemaName}Item${index}`;
          return processValue(item, itemSchemaName);
        });
        return `z.array(z.union([${itemSchemas.join(', ')}]))`;
      }
    }

    if (typeof value === 'object') {
      const properties: string[] = [];

      for (const [key, propValue] of Object.entries(value)) {
        const propType = getTypeOf(propValue);
        const sanitizedKey = sanitizePropertyName(key);

        if (propType === 'object') {
          const propSchemaName = `${schemaName}${toPascalCase(key)}`;
          properties.push(`  ${sanitizedKey}: ${propSchemaName},`);
        } else if (propType === 'array') {
          const arraySchemaName = `${schemaName}${toPascalCase(key)}`;
          const arraySchema = processValue(propValue, arraySchemaName);
          properties.push(`  ${sanitizedKey}: ${arraySchema},`);
        } else if (propType === 'string') {
          properties.push(`  ${sanitizedKey}: z.string(),`);
        } else if (propType === 'number') {
          properties.push(`  ${sanitizedKey}: z.number(),`);
        } else if (propType === 'boolean') {
          properties.push(`  ${sanitizedKey}: z.boolean(),`);
        } else if (propType === 'null') {
          properties.push(`  ${sanitizedKey}: z.null(),`);
        } else {
          properties.push(`  ${sanitizedKey}: z.any(),`);
        }
      }

      const schemaDefinition = `const ${schemaName} = z.object({\n${properties.join('\n')}\n})`;
      schemaMap.set(schemaName, schemaDefinition);

      return schemaName;
    }

    if (typeof value === 'string') {
      return 'z.string()';
    }

    if (typeof value === 'number') {
      return 'z.number()';
    }

    if (typeof value === 'boolean') {
      return 'z.boolean()';
    }

    return 'z.any()';
  }

  processValue(json, rootTypeName);

  // Build the final output with all schemas
  const schemas: string[] = [];
  schemas.push("import { z } from 'zod';");
  schemas.push('');

  // Add schemas in reverse order (dependencies first)
  Array.from(schemaMap.entries())
    .reverse()
    .forEach(([, definition]) => {
      schemas.push(definition);
    });

  // Add export to the root schema
  schemas.push('');
  schemas.push(`export type ${rootTypeName} = z.infer<typeof ${rootTypeName}>`);
  schemas.push(`export { ${rootTypeName} }`);

  return schemas.join('\n');
}
