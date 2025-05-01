import { JSONObject, JSONValue } from "@/types/json";
import { capitalize, isISODate } from "@/lib/utils";

interface TypeMap {
  [typeName: string]: string;
}

function inferTsType(value: JSONValue): string {
  if (value === null) return "null";

  if (Array.isArray(value)) {
    if (value.length === 0) return "any[]";
    const types = [...new Set(value.map(inferTsType))];
    const unified = types.length === 1 ? types[0] : `(${types.join(" | ")})`;
    return `${unified}[]`;
  }

  if (typeof value === "object") return "__OBJECT__";
  if (typeof value === "string") return isISODate(value) ? "Date" : "string";
  if (typeof value === "number") return "number";
  if (typeof value === "boolean") return "boolean";

  return "any";
}

function refineUnionTypes(types: string[]): string[] {
  const refined = new Set<string>();
  for (const type of types) {
    if (type === "any") return ["any"];
    if (type === "string" && types.includes("Date")) continue;
    refined.add(type);
  }
  return Array.from(refined);
}

let typeCounter = 1;

function buildTsTypes(
  samples: JSONObject[],
  rootName: string,
  makeAllOptional = false,
  typeMap: TypeMap = {},
  visited = new WeakSet<object>(),
): { mainType: string; types: TypeMap } {
  const space = (n: number) => "  ".repeat(n);

  function buildType(
    samples: JSONObject[],
    _nameHint: string,
    indent = 1,
  ): string {
    const allKeys = new Set(samples.flatMap((obj) => Object.keys(obj)));
    const entries: string[] = [];

    for (const key of allKeys) {
      const values = samples.map((s) => s[key]).filter((v) => v !== undefined);
      const isOptional = makeAllOptional || values.length < samples.length;

      const objectSamples: JSONObject[] = [];
      const nonObjectTypes: string[] = [];

      for (const val of values) {
        if (typeof val === "object" && val !== null && !Array.isArray(val)) {
          if (!visited.has(val)) {
            objectSamples.push(val as JSONObject);
          }
        } else {
          nonObjectTypes.push(inferTsType(val));
        }
      }

      const types: string[] = [];

      if (nonObjectTypes.length) {
        types.push(...new Set(nonObjectTypes));
      }

      if (objectSamples.length) {
        if (objectSamples[0]) {
          visited.add(objectSamples[0]);
        }
        const uniqueName = getUniqueTypeName(capitalize(key), typeMap);
        const nested = buildType(objectSamples, uniqueName, indent + 1);
        typeMap[uniqueName] = `export interface ${uniqueName} {\n${nested}\n}`;
        types.push(uniqueName);
      }

      const refined = refineUnionTypes(types);
      const typeStr = refined.length === 1 ? refined[0] : refined.join(" | ");
      // if (isOptional) typeStr += " | undefined";
      entries.push(
        `${space(indent)}${key}${isOptional ? "?" : ""}: ${typeStr};`,
      );
    }

    return entries.join("\n");
  }

  const rootBody = buildType(samples, rootName);
  typeMap[rootName] = `export interface ${rootName} {\n${rootBody}\n}`;
  return { mainType: rootName, types: typeMap };
}

function getUniqueTypeName(base: string, map: Record<string, string>): string {
  let name = capitalize(base);
  while (map[name]) {
    name = `${base}${typeCounter++}`;
    name = capitalize(name);
  }
  return name;
}

export function jsonSampleToTypescriptInterfaces({
  name,
  samples,
  makeAllOptional = false,
}: {
  name: string;
  samples: JSONObject[];
  makeAllOptional?: boolean;
}): string {
  typeCounter = 1;
  const { types } = buildTsTypes(samples, capitalize(name), makeAllOptional);
  return Object.values(types).join("\n\n");
}
