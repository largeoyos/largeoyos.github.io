import fs from 'node:fs';
const file = new URL('./fx-991cn-x-%E7%A7%91%E5%AD%A6%E8%AE%A1%E7%AE%97%E5%99%A8/src/math/FormulaLcd.tsx', import.meta.url);
const original = fs.readFileSync(file, 'utf8');
const eol = original.includes('\r\n') ? '\r\n' : '\n';
let source = original.replaceAll('\r\n', '\n');
const replacements = [
  ["lines.slice(0, 9).forEach((line, index) => {", "lines.slice(0, customItems ? 4 : 9).forEach((line, index) => {"],
  ["const y = 13 + row * (singleColumn ? 10 : 12);", "const y = 13 + row * (customItems ? 13 : singleColumn ? 10 : 12);"],
  ["Math.floor((y - 12) / 10)", "Math.floor((y - 12) / (props.listItems ? 13 : 10))"],
];
for (const [before, after] of replacements) {
  if (!source.includes(before)) throw new Error(`LCD spacing patch target missing: ${before}`);
  source = source.replace(before, after);
}
fs.writeFileSync(file, source.replaceAll('\n', eol), 'utf8');
