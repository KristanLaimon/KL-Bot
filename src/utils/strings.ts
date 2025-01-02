export function Str_CapitalizeStr(str: string): string {
  return str.slice(0, 1).toUpperCase() + str.slice(1).toLowerCase();
}

export function Str_NormalizeLiteralString(str: string): string {
  if (!str) return '';
  return str.trim().split("\n").map((line) => line.trim() || line).join("\n");
}

export function Str_StringifyObj(obj: object, separation: number = 2): string {
  return JSON.stringify(obj, null, separation);
}

function Str_Internal_CenterTextLine(text:string, fixedWidth: number, borderChar:string = ""):string{
  if(text.length > fixedWidth) return text;
  const horizontalPadding = (fixedWidth - text.length) / 2;
  return borderChar + " ".repeat(horizontalPadding) + text + " ".repeat(horizontalPadding) + borderChar;
}

export function Str_CenterText(text:string[]|string, maxWidth?:number | "auto", borderChar?:string, extraPadding: number = 0){
  if(text instanceof Array) text = text.join("\n");
  const sanitizedLines = text.trim().split("\n").map(line => line.trim());
  let maxLineLength: number;

  if(maxWidth === "auto")
    maxLineLength = Math.max(...sanitizedLines.map((line) => line.length));
  else
    maxLineLength = maxWidth;

  maxLineLength += extraPadding * 2;

  return sanitizedLines.map((line) => Str_Internal_CenterTextLine(line, maxLineLength, borderChar)).join("\n");
}
