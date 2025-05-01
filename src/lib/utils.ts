import { JSONArray, JSONValue } from '@/types/json';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isISODate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?$/.test(value);
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function toPascalCase(str: string): string {
  return str
    .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
    .replace(/^(.)/, (_, c) => c.toUpperCase());
}

export function toCamelCase(str: string): string {
  return str
    .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
    .replace(/^(.)/, (_, c) => c.toLowerCase());
}

export function toSnakeCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .toLowerCase();
}

export function allItemsHaveSameType(arr: JSONArray): boolean {
  if (arr.length <= 1) return true;

  const firstItemType = getTypeOf(arr[0]);
  return arr.every((item) => getTypeOf(item) === firstItemType);
}

export function getTypeOf(value: JSONValue): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

export function sanitizePropertyName(name: string): string {
  // Handle property names that are not valid identifiers
  if (/^[0-9]/.test(name) || /[^a-zA-Z0-9_]/.test(name)) {
    return `"${name}"`;
  }
  return name;
}
