import type React from 'react';

export type JSONPrimitive = string | number | boolean | null;
export type JSONValue = JSONPrimitive | JSONObject | JSONArray;
export interface JSONObject {
  [key: string]: JSONValue;
}
export type JSONArray = Array<JSONValue>;

export type Language =
  | 'typescript'
  | 'json'
  | 'python'
  | 'python-dict'
  | 'go'
  | 'rust'
  | 'zod';

export interface LanguageOption {
  value: Language;
  label: string;
  icon?: React.ReactNode;
  fileExtension: string;
}
