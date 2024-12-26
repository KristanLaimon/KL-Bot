export function CapitalizeStr(str: string): string {
  return str.slice(0, 1).toUpperCase() + str.slice(1).toLowerCase();
}

export function Str_NormalizeLiteralString(str: string): string {
  if (!str) return '';
  return str.trim().split("\n").map((line) => line.trim() || line).join("\n");
}