import fs from 'node:fs';
const appFile = new URL('./fx-991cn-x-%E7%A7%91%E5%AD%A6%E8%AE%A1%E7%AE%97%E5%99%A8/src/App.tsx', import.meta.url);
const lcdFile = new URL('./fx-991cn-x-%E7%A7%91%E5%AD%A6%E8%AE%A1%E7%AE%97%E5%99%A8/src/math/FormulaLcd.tsx', import.meta.url);

function update(file, replacements) {
  const original = fs.readFileSync(file, 'utf8');
  const eol = original.includes('\r\n') ? '\r\n' : '\n';
  let source = original.replaceAll('\r\n', '\n');
  for (const [before, after, label] of replacements) {
    if (!source.includes(before)) throw new Error(`Settings patch target missing: ${label}`);
    source = source.replace(before, after);
  }
  fs.writeFileSync(file, source.replaceAll('\n', eol), 'utf8');
}

update(appFile, [
  [
    `function approximateFraction(value: number, maxDenominator = 100000): string {`,
    `function cycleNumberFormat(format: NumberFormat): NumberFormat {
  if (format.kind === 'Norm1') return { kind: 'Norm2' };
  if (format.kind === 'Norm2') return { kind: 'Fix', digits: 0 };
  if (format.kind === 'Fix' && format.digits < 9) return { kind: 'Fix', digits: format.digits + 1 };
  if (format.kind === 'Fix') return { kind: 'Sci', digits: 1 };
  if (format.digits < 10) return { kind: 'Sci', digits: format.digits + 1 };
  return { kind: 'Norm1' };
}

function approximateFraction(value: number, maxDenominator = 100000): string {`,
    'number format cycle helper',
  ],
  ["const catalogPageStart = Math.floor(catalogIndex / 5) * 5;", "const catalogPageStart = Math.floor(catalogIndex / 4) * 4;", 'catalog page size'],
  ["if (/^[1-5]$/.test(activeVal))", "if (/^[1-4]$/.test(activeVal))", 'catalog numeric shortcuts'],
  ["setNumberFormat(previous => previous.kind === 'Norm1' ? { kind: 'Norm2' } : { kind: 'Norm1' });", "setNumberFormat(previous => cycleNumberFormat(previous));", 'all number formats'],
  ["catalogView.items.slice(catalogPageStart, catalogPageStart + 5)", "catalogView.items.slice(catalogPageStart, catalogPageStart + 4)", 'catalog LCD page size'],
]);

update(lcdFile, [[
  "if (activeMenu === 'SETUP') lines = ['1 DEG', '2 RAD', '3 GRAD', '4 DISPLAY'];",
  "if (activeMenu === 'SETUP') lines = ['1 DEG', '2 RAD', '3 GRAD', '4 EXACT/DEC', '5 FORMAT NEXT'];",
  'setup LCD options',
]]);
