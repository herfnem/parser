import {
  allItemsHaveSameType,
  getTypeOf,
  toCamelCase,
  toPascalCase,
} from '@/lib/utils';
import { JSONValue } from '@/types/json';

// Helper to sanitize property names for Java
function sanitizePropertyName(name: string): string {
  // Java keywords to avoid
  const javaKeywords = [
    'abstract',
    'assert',
    'boolean',
    'break',
    'byte',
    'case',
    'catch',
    'char',
    'class',
    'const',
    'continue',
    'default',
    'do',
    'double',
    'else',
    'enum',
    'extends',
    'final',
    'finally',
    'float',
    'for',
    'goto',
    'if',
    'implements',
    'import',
    'instanceof',
    'int',
    'interface',
    'long',
    'native',
    'new',
    'package',
    'private',
    'protected',
    'public',
    'return',
    'short',
    'static',
    'strictfp',
    'super',
    'switch',
    'synchronized',
    'this',
    'throw',
    'throws',
    'transient',
    'try',
    'void',
    'volatile',
    'while',
  ];

  if (javaKeywords.includes(name)) {
    return `_${name}`;
  }
  return name;
}

// Generate Java classes from JSON
export function jsonToJava(json: JSONValue, rootTypeName = 'RootType'): string {
  const classMap = new Map<string, string>();
  const processedClasses = new Set<string>();
  const imports = new Set<string>();

  imports.add('import java.util.List;');
  imports.add('import java.util.Map;');
  imports.add('import java.util.ArrayList;');
  imports.add('import java.util.HashMap;');
  imports.add('import com.fasterxml.jackson.annotation.JsonProperty;');

  function processValue(value: JSONValue, className: string): string {
    if (processedClasses.has(className)) {
      return className;
    }

    processedClasses.add(className);

    if (value === null) {
      return 'Object';
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return 'List<Object>';
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
          return 'List<String>';
        } else if (itemType === 'number') {
          // Check if all numbers are integers
          const allIntegers = value.every((num) => Number.isInteger(num));
          return allIntegers ? 'List<Integer>' : 'List<Double>';
        } else if (itemType === 'boolean') {
          return 'List<Boolean>';
        } else {
          return 'List<Object>';
        }
      } else {
        // Mixed types in array
        return 'List<Object>';
      }
    }

    if (typeof value === 'object') {
      const fields: string[] = [];
      const getters: string[] = [];
      const setters: string[] = [];
      const constructorParams: string[] = [];
      const constructorAssignments: string[] = [];

      for (const [key, propValue] of Object.entries(value)) {
        const propType = getTypeOf(propValue);
        const sanitizedKey = sanitizePropertyName(key);
        const camelCaseKey = toCamelCase(key);
        const pascalCaseKey = toPascalCase(key);

        // Add JsonProperty annotation if the property name is different from the JSON key
        const jsonPropertyAnnotation =
          camelCaseKey !== key ? `    @JsonProperty("${sanitizedKey}")\n` : '';

        if (propType === 'object') {
          const propClassName = `${className}${pascalCaseKey}`;
          processValue(propValue, propClassName);
          fields.push(
            `${jsonPropertyAnnotation}    private ${propClassName} ${camelCaseKey};`,
          );
          getters.push(
            `    public ${propClassName} get${pascalCaseKey}() {\n        return ${camelCaseKey};\n    }`,
          );
          setters.push(
            `    public void set${pascalCaseKey}(${propClassName} ${camelCaseKey}) {\n        this.${camelCaseKey} = ${camelCaseKey};\n    }`,
          );
          constructorParams.push(`${propClassName} ${camelCaseKey}`);
          constructorAssignments.push(
            `        this.${camelCaseKey} = ${camelCaseKey};`,
          );
        } else if (propType === 'array') {
          const arrayClassName = `${className}${pascalCaseKey}`;
          const arrayType = processValue(propValue, arrayClassName);
          fields.push(
            `${jsonPropertyAnnotation}    private ${arrayType} ${camelCaseKey};`,
          );
          getters.push(
            `    public ${arrayType} get${pascalCaseKey}() {\n        return ${camelCaseKey};\n    }`,
          );
          setters.push(
            `    public void set${pascalCaseKey}(${arrayType} ${camelCaseKey}) {\n        this.${camelCaseKey} = ${camelCaseKey};\n    }`,
          );
          constructorParams.push(`${arrayType} ${camelCaseKey}`);
          constructorAssignments.push(
            `        this.${camelCaseKey} = ${camelCaseKey};`,
          );
        } else if (propType === 'string') {
          fields.push(
            `${jsonPropertyAnnotation}    private String ${camelCaseKey};`,
          );
          getters.push(
            `    public String get${pascalCaseKey}() {\n        return ${camelCaseKey};\n    }`,
          );
          setters.push(
            `    public void set${pascalCaseKey}(String ${camelCaseKey}) {\n        this.${camelCaseKey} = ${camelCaseKey};\n    }`,
          );
          constructorParams.push(`String ${camelCaseKey}`);
          constructorAssignments.push(
            `        this.${camelCaseKey} = ${camelCaseKey};`,
          );
        } else if (propType === 'number') {
          // Check if the number is an integer
          const isInteger = Number.isInteger(propValue);
          const javaType = isInteger ? 'Integer' : 'Double';
          fields.push(
            `${jsonPropertyAnnotation}    private ${javaType} ${camelCaseKey};`,
          );
          getters.push(
            `    public ${javaType} get${pascalCaseKey}() {\n        return ${camelCaseKey};\n    }`,
          );
          setters.push(
            `    public void set${pascalCaseKey}(${javaType} ${camelCaseKey}) {\n        this.${camelCaseKey} = ${camelCaseKey};\n    }`,
          );
          constructorParams.push(`${javaType} ${camelCaseKey}`);
          constructorAssignments.push(
            `        this.${camelCaseKey} = ${camelCaseKey};`,
          );
        } else if (propType === 'boolean') {
          fields.push(
            `${jsonPropertyAnnotation}    private Boolean ${camelCaseKey};`,
          );
          getters.push(
            `    public Boolean get${pascalCaseKey}() {\n        return ${camelCaseKey};\n    }`,
          );
          setters.push(
            `    public void set${pascalCaseKey}(Boolean ${camelCaseKey}) {\n        this.${camelCaseKey} = ${camelCaseKey};\n    }`,
          );
          constructorParams.push(`Boolean ${camelCaseKey}`);
          constructorAssignments.push(
            `        this.${camelCaseKey} = ${camelCaseKey};`,
          );
        } else if (propType === 'null') {
          fields.push(
            `${jsonPropertyAnnotation}    private Object ${camelCaseKey};`,
          );
          getters.push(
            `    public Object get${pascalCaseKey}() {\n        return ${camelCaseKey};\n    }`,
          );
          setters.push(
            `    public void set${pascalCaseKey}(Object ${camelCaseKey}) {\n        this.${camelCaseKey} = ${camelCaseKey};\n    }`,
          );
          constructorParams.push(`Object ${camelCaseKey}`);
          constructorAssignments.push(
            `        this.${camelCaseKey} = ${camelCaseKey};`,
          );
        } else {
          fields.push(
            `${jsonPropertyAnnotation}    private Object ${camelCaseKey};`,
          );
          getters.push(
            `    public Object get${pascalCaseKey}() {\n        return ${camelCaseKey};\n    }`,
          );
          setters.push(
            `    public void set${pascalCaseKey}(Object ${camelCaseKey}) {\n        this.${camelCaseKey} = ${camelCaseKey};\n    }`,
          );
          constructorParams.push(`Object ${camelCaseKey}`);
          constructorAssignments.push(
            `        this.${camelCaseKey} = ${camelCaseKey};`,
          );
        }
      }

      // Build class definition
      let classDefinition = `public class ${className} {\n`;

      // Add fields
      classDefinition += fields.join('\n') + '\n\n';

      // Add constructor
      classDefinition += `    public ${className}(${constructorParams.join(', ')}) {\n${constructorAssignments.join('\n')}\n    }\n\n`;

      // Add no-args constructor
      classDefinition += `    public ${className}() {\n        // Default constructor for Jackson\n    }\n\n`;

      // Add getters and setters
      classDefinition += getters.join('\n\n') + '\n\n' + setters.join('\n\n');

      // Close class
      classDefinition += '\n}';

      classMap.set(className, classDefinition);

      return className;
    }

    if (typeof value === 'string') {
      return 'String';
    }

    if (typeof value === 'number') {
      return Number.isInteger(value) ? 'Integer' : 'Double';
    }

    if (typeof value === 'boolean') {
      return 'Boolean';
    }

    return 'Object';
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
  classes.push('// Example usage:');
  classes.push('// ObjectMapper mapper = new ObjectMapper();');
  classes.push(
    `// ${rootTypeName} ${toCamelCase(rootTypeName)} = mapper.readValue(jsonString, ${rootTypeName}.class);`,
  );

  return classes.join('\n');
}
