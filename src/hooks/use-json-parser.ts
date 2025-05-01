import { useDebounce } from '@/hooks/use-debounce';
import { jsonToGo } from '@/lib/json/json-to-go';
import { jsonToPython } from '@/lib/json/json-to-python';
import { jsonToPythonDict } from '@/lib/json/json-to-python-dict';
import { jsonToRust } from '@/lib/json/json-to-rust';
import { jsonToTypeScript } from '@/lib/json/json-to-types';
import { jsonToZodSchema } from '@/lib/json/json-to-zod';
import { JSONValue } from '@/types/json';
import { useEffect, useMemo, useState } from 'react';
interface ParseResult {
  valid: boolean;
  data?: JSONValue;
  error?: string;
}

export function useJsonParser(jsonInput: string, rootTypeName = 'RootType') {
  const [parseResult, setParseResult] = useState<ParseResult>({ valid: false });
  const [isProcessing, setIsProcessing] = useState(false);
  const debouncedJsonInput = useDebounce(jsonInput, 500);

  // Parse JSON input
  useEffect(() => {
    if (!debouncedJsonInput.trim()) {
      setParseResult({ valid: false });
      return;
    }
    try {
      setIsProcessing(true);
      const parsedData = JSON.parse(debouncedJsonInput) as JSONValue;
      setParseResult({ valid: true, data: parsedData });
    } catch (error) {
      if (error instanceof Error) {
        setParseResult({ valid: false, error: error.message });
      } else {
        setParseResult({ valid: false, error: 'Invalid JSON' });
      }
    } finally {
      setIsProcessing(false);
    }
  }, [debouncedJsonInput]);

  // Generate outputs for all languages
  const outputs = useMemo(() => {
    if (!parseResult.valid || !parseResult.data) {
      return {
        typescript: '',
        python: '',
        // swift: '',
        // java: '',
        // csharp: '',
        go: '',
        rust: '',
        zod: '',
        json: '',
        'python-dict': '',
      };
    }

    return {
      typescript: jsonToTypeScript(parseResult?.data, rootTypeName),
      python: jsonToPython(parseResult.data, rootTypeName),
      // swift: jsonToSwift(parseResult.data, rootTypeName),
      // java: jsonToJava(parseResult.data, rootTypeName),
      // csharp: jsonToCSharp(parseResult?.data, rootTypeName),
      go: jsonToGo(parseResult.data, rootTypeName),
      rust: jsonToRust(parseResult.data, rootTypeName),
      zod: jsonToZodSchema(parseResult.data, rootTypeName),
      json: JSON.stringify(parseResult.data, null, 2),
      'python-dict': jsonToPythonDict(parseResult.data, 0),
    };
  }, [parseResult.valid, parseResult.data, rootTypeName]);

  return {
    parseResult,
    isError: !parseResult.valid && !!debouncedJsonInput,
    errorMessage: parseResult.error,
    outputs,
    isProcessing,
  };
}
