export function CapitalizeStr(str: string): string {
  return str.slice(0, 1).toUpperCase() + str.slice(1).toLowerCase();
}