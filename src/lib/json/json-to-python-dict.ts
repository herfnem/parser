export function jsonToPythonDict(obj: unknown, indent = 0): string {
  const spaces = ' '.repeat(indent);

  if (obj === null) {
    return 'None';
  }

  if (typeof obj === 'string') {
    // Escape backslashes and quotes properly
    return `"${obj.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
  }

  if (typeof obj === 'number') {
    return String(obj);
  }

  if (typeof obj === 'boolean') {
    // Python uses True/False with capital first letter
    return obj ? 'True' : 'False';
  }

  if (Array.isArray(obj)) {
    if (obj.length === 0) {
      return '[]';
    }

    const items = obj
      .map((item) => jsonToPythonDict(item, indent + 4))
      .join(',\n' + spaces + '    ');
    return `[\n${spaces}    ${items}\n${spaces}]`;
  }

  if (typeof obj === 'object') {
    const entries = Object.entries(obj);
    if (entries.length === 0) {
      return '{}';
    }

    const items = entries
      .map(([key, value]) => {
        return `"${key}": ${jsonToPythonDict(value, indent + 4)}`;
      })
      .join(',\n' + spaces + '    ');

    return `{\n${spaces}    ${items}\n${spaces}}`;
  }

  console.log(obj);

  return obj as string;
}
