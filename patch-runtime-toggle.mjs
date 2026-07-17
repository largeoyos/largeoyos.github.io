import fs from 'node:fs';
const file = new URL('./fx-991cn-x-%E7%A7%91%E5%AD%A6%E8%AE%A1%E7%AE%97%E5%99%A8/src/core/runtime.ts', import.meta.url);
const original = fs.readFileSync(file, 'utf8');
const eol = original.includes('\r\n') ? '\r\n' : '\n';
let source = original.replaceAll('\r\n', '\n');
const replacements = [
  ["          showDecimal: context.resultMode === 'decimal',", "          showDecimal: context.resultMode === 'decimal',\n          decimalEntries: entries.map(() => context.resultMode === 'decimal'),"],
  ["    if (entry?.exact) next.screen.showDecimal = !next.screen.showDecimal;", "    if (entry?.exact) {\n      next.screen.decimalEntries ??= next.screen.entries?.map(() => next.screen.showDecimal ?? false);\n      next.screen.decimalEntries![next.screen.selected] = !next.screen.decimalEntries![next.screen.selected];\n    }"],
  ["      formulaLines: visible.map(entry => ({\n        label: entry.label,\n        document: !screen.showDecimal && entry.exact ? exactValueToFormulaDocument(entry.exact) : undefined,\n        text: screen.showDecimal || !entry.exact ? entry.decimal : undefined,", "      formulaLines: visible.map((entry, index) => ({\n        label: entry.label,\n        document: !(screen.decimalEntries?.[start + index] ?? screen.showDecimal) && entry.exact ? exactValueToFormulaDocument(entry.exact) : undefined,\n        text: (screen.decimalEntries?.[start + index] ?? screen.showDecimal) || !entry.exact ? entry.decimal : undefined,"],
];
for (const [before, after] of replacements) {
  if (!source.includes(before)) throw new Error(`Runtime toggle patch target missing: ${before}`);
  source = source.replace(before, after);
}
fs.writeFileSync(file, source.replaceAll('\n', eol), 'utf8');
