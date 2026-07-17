import fs from 'node:fs';
const file = new URL('./fx-991cn-x-%E7%A7%91%E5%AD%A6%E8%AE%A1%E7%AE%97%E5%99%A8/src/core/calculator.ts', import.meta.url);
const original = fs.readFileSync(file, 'utf8');
const eol = original.includes('\r\n') ? '\r\n' : '\n';
let source = original.replaceAll('\r\n', '\n');
const replacements = [
  ["'rand', 'd', 'dx', 'integral'", "'rand', 'd', 'dx', 'derivative', 'integral'"],
  ["if (a.type === 'identifier' && b.type === 'paren' && b.value === '(' && FUNCTIONS.has(a.value.toLowerCase())) return false;", "if (a.type === 'identifier' && b.type === 'paren' && b.value === '(') {\n    const name = a.value.toLowerCase();\n    if (FUNCTIONS.has(name) || name.startsWith('conv_')) return false;\n  }"],
  ["['d', 'dx', 'integral', 'sum', 'solve', 'recur']", "['d', 'dx', 'derivative', 'integral', 'sum', 'solve', 'recur']"],
  ["if (fn === 'd' || fn === 'dx')", "if (fn === 'd' || fn === 'dx' || fn === 'derivative')"],
];
for (const [before, after] of replacements) {
  if (!source.includes(before)) throw new Error(`Calculator function patch target missing: ${before}`);
  source = source.replace(before, after);
}
fs.writeFileSync(file, source.replaceAll('\n', eol), 'utf8');
