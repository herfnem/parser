import type { JSONObject } from '@/types/json';

/**
 * Represents a JSON parsing error with detailed information
 */
export interface JsonError {
  message: string;
  line?: number;
  column?: number;
  suggestion?: string;
}

/**
 * Result of parsing JSON
 */
export interface ParseResult {
  parsed: unknown | null;
  formatted: string;
  errors: JsonError[];
  fixed: boolean;
}

/**
 * Attempts to parse a JSON string, handling potential errors
 */
export function parseJson(jsonString: string): ParseResult {
  if (!jsonString.trim()) {
    return {
      parsed: null,
      formatted: '',
      errors: [{ message: 'Please enter some JSON to parse' }],
      fixed: false,
    };
  }

  try {
    // Try to parse the JSON as-is
    const parsed = JSON.parse(jsonString);
    return {
      parsed,
      formatted: JSON.stringify(parsed, null, 2),
      errors: [],
      fixed: false,
    };
  } catch (error) {
    // If parsing fails, try to fix common issues
    const { fixedJson, errors, fixed } = fixJsonString(jsonString);

    try {
      // Try to parse the fixed JSON
      const parsed = JSON.parse(fixedJson);
      return {
        parsed,
        formatted: JSON.stringify(parsed, null, 2),
        errors,
        fixed,
      };
    } catch {
      // If still fails, return the original error
      return {
        parsed: null,
        formatted: '',
        errors: [
          {
            message: `Invalid JSON: ${(error as Error).message}`,
            suggestion: 'Check for missing quotes, brackets, or commas',
          },
          ...errors,
        ],
        fixed: false,
      };
    }
  }
}

/**
 * Formats a JSON object with proper indentation
 */
export function formatJson(jsonObj: JSONObject): string {
  try {
    return JSON.stringify(jsonObj, null, 2);
  } catch (error) {
    throw new Error(`Error formatting JSON: ${(error as Error).message}`);
  }
}

/**
 * Attempts to fix common JSON syntax errors
 */
export function fixJsonString(jsonString: string): {
  fixedJson: string;
  errors: JsonError[];
  fixed: boolean;
} {
  let fixedJson = jsonString;
  const errors: JsonError[] = [];
  let fixed = false;

  const unquotedKeyRegex = /([{,]\s*)([a-zA-Z0-9_$]+)(\s*:)/g;
  if (unquotedKeyRegex.test(fixedJson)) {
    fixedJson = fixedJson.replace(unquotedKeyRegex, '$1"$2"$3');
    errors.push({
      message: 'Unquoted object keys detected and fixed',
      suggestion: 'In JSON, all object keys must be quoted with double quotes',
    });
    fixed = true;
  }

  if (fixedJson.includes("'")) {
    // Only replace single quotes that are likely to be string delimiters
    // This regex tries to identify single quotes used for strings
    const singleQuoteRegex = /([:,[{\s])'([^']*?)'([,\]}\s:])/g;
    if (singleQuoteRegex.test(fixedJson)) {
      fixedJson = fixedJson.replace(singleQuoteRegex, '$1"$2"$3');
      errors.push({
        message: 'Single quotes detected and replaced with double quotes',
        suggestion:
          'JSON requires double quotes for strings, not single quotes',
      });
      fixed = true;
    }
  }

  if (/,\s*\}/.test(fixedJson)) {
    fixedJson = fixedJson.replace(/,(\s*\})/g, '$1');
    errors.push({
      message: 'Trailing commas in objects removed',
      suggestion: "JSON doesn't allow trailing commas in objects",
    });
    fixed = true;
  }

  if (/,\s*\]/.test(fixedJson)) {
    fixedJson = fixedJson.replace(/,(\s*\])/g, '$1');
    errors.push({
      message: 'Trailing commas in arrays removed',
      suggestion: "JSON doesn't allow trailing commas in arrays",
    });
    fixed = true;
  }

  const potentialUnquotedStrings = /:\s*([a-zA-Z][a-zA-Z0-9_-]*)\s*([,}\]])/g;
  if (potentialUnquotedStrings.test(fixedJson)) {
    // Don't quote true, false, null, or numbers
    fixedJson = fixedJson.replace(potentialUnquotedStrings, (match, p1, p2) => {
      if (['true', 'false', 'null'].includes(p1) || !isNaN(Number(p1))) {
        return match;
      }
      return `: "${p1}"${p2}`;
    });
    errors.push({
      message: 'Unquoted string values detected and fixed',
      suggestion: 'String values in JSON must be enclosed in double quotes',
    });
    fixed = true;
  }

  const openBrackets = (fixedJson.match(/\[/g) || []).length;
  const closeBrackets = (fixedJson.match(/\]/g) || []).length;
  const openBraces = (fixedJson.match(/\{/g) || []).length;
  const closeBraces = (fixedJson.match(/\}/g) || []).length;

  if (openBrackets > closeBrackets) {
    fixedJson += ']'.repeat(openBrackets - closeBrackets);
    errors.push({
      message: `Added ${openBrackets - closeBrackets} missing closing bracket(s)`,
      suggestion: 'Ensure all opening brackets have matching closing brackets',
    });
    fixed = true;
  } else if (closeBrackets > openBrackets) {
    errors.push({
      message: `Found ${closeBrackets - openBrackets} extra closing bracket(s)`,
      suggestion:
        'Remove extra closing brackets or add missing opening brackets',
    });
  }

  if (openBraces > closeBraces) {
    fixedJson += '}'.repeat(openBraces - closeBraces);
    errors.push({
      message: `Added ${openBraces - closeBraces} missing closing brace(s)`,
      suggestion: 'Ensure all opening braces have matching closing braces',
    });
    fixed = true;
  } else if (closeBraces > openBraces) {
    errors.push({
      message: `Found ${closeBraces - openBraces} extra closing brace(s)`,
      suggestion: 'Remove extra closing braces or add missing opening braces',
    });
  }

  if (fixedJson.includes('//') || fixedJson.includes('/*')) {
    // Remove single-line comments
    fixedJson = fixedJson.replace(/\/\/.*$/gm, '');

    // Remove multi-line comments (this is a simplified approach)
    fixedJson = fixedJson.replace(/\/\*[\s\S]*?\*\//g, '');

    errors.push({
      message: 'JavaScript comments removed',
      suggestion: "JSON doesn't support comments",
    });
    fixed = true;
  }

  return { fixedJson, errors, fixed };
}
