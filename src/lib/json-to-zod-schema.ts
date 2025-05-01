import { JSONObject, JSONValue } from "@/types/json";
import { isISODate } from "@/lib/utils";

function inferZodType(value: JSONValue): string {
  if (value === null) return "z.null()";

  if (Array.isArray(value)) {
    if (value.length === 0) return "z.array(z.any())";
    const types = [...new Set(value.map(inferZodType))];
    const unified =
      types.length === 1 ? types[0] : `z.union([${types.join(", ")}])`;
    return `z.array(${unified})`;
  }

  if (typeof value === "object") return "__OBJECT__";
  if (typeof value === "string") {
    return isISODate(value) ? "z.coerce.date()" : "z.string()";
  }
  if (typeof value === "number") return "z.number()";
  if (typeof value === "boolean") return "z.boolean()";

  return "z.any()";
}

function mergeZodTypes(values: JSONValue[]): string {
  const inferred = values.map(inferZodType);

  // Enum detection
  const isEnumCandidate =
    values.length > 0 &&
    values.every((v) => typeof v === "string") &&
    new Set(values as string[]).size <= 10;

  if (isEnumCandidate) {
    const literals = Array.from(new Set(values as string[]))
      .map((v) => `"${v}"`)
      .join(", ");
    return `z.enum([${literals}])`;
  }

  const unique = [...new Set(inferred)];
  return unique.length === 1
    ? (unique[0] ?? "z.any()")
    : `z.union([${unique.join(", ")}])`;
}

function buildSchema(
  samples: JSONObject[],
  indent = 1,
  makeAllOptional = false,
): string {
  const allKeys = new Set(samples.flatMap((obj) => Object.keys(obj)));
  const space = (n: number) => "  ".repeat(n);

  const entries = Array.from(allKeys).map((key) => {
    const values = samples.map((s) => s[key]).filter((v) => v !== undefined);
    const isOptional = makeAllOptional || values.length < samples.length;

    const isObject = values.some(
      (v) => typeof v === "object" && v !== null && !Array.isArray(v),
    );

    let typeStr: string;

    if (isObject) {
      const nested = values.filter(
        (v) => typeof v === "object" && v !== null && !Array.isArray(v),
      ) as JSONObject[];
      typeStr = `z.object(${buildSchema(nested, indent + 1, makeAllOptional)})`;
    } else {
      typeStr = mergeZodTypes(values);
    }

    if (isOptional) typeStr += ".optional()";
    return `${space(indent)}${key}: ${typeStr}`;
  });

  return `{\n${entries.join(",\n")}\n${space(indent - 1)}}`;
}

export function jsonSampleToZodSchema({
  name,
  samples,
  makeAllOptional = false,
}: {
  name: string;
  samples: JSONObject[];
  makeAllOptional?: boolean;
}): string {
  const schemaBody = buildSchema(samples, 1, makeAllOptional);
  return `
import { z } from 'zod';

export const ${name}Schema = z.object(${schemaBody});

export type ${name} = z.infer<typeof ${name}Schema>;
`.trim();
}
