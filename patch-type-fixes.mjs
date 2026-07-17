import fs from 'node:fs';
const root = new URL('./fx-991cn-x-%E7%A7%91%E5%AD%A6%E8%AE%A1%E7%AE%97%E5%99%A8/src/', import.meta.url);
function replace(fileName, before, after) {
  const file = new URL(fileName, root);
  const original = fs.readFileSync(file, 'utf8');
  if (!original.includes(before)) throw new Error(`Type fix target missing: ${fileName}`);
  fs.writeFileSync(file, original.replace(before, after), 'utf8');
}
replace('App.tsx',
`function cycleNumberFormat(format: NumberFormat): NumberFormat {
  if (format.kind === 'Norm1') return { kind: 'Norm2' };
  if (format.kind === 'Norm2') return { kind: 'Fix', digits: 0 };
  if (format.kind === 'Fix' && format.digits < 9) return { kind: 'Fix', digits: format.digits + 1 };
  if (format.kind === 'Fix') return { kind: 'Sci', digits: 1 };
  if (format.digits < 10) return { kind: 'Sci', digits: format.digits + 1 };
  return { kind: 'Norm1' };
}`,
`function cycleNumberFormat(format: NumberFormat): NumberFormat {
  if (!('digits' in format)) return format.kind === 'Norm1' ? { kind: 'Norm2' } : { kind: 'Fix', digits: 0 };
  if (format.kind === 'Fix' && format.digits < 9) return { kind: 'Fix', digits: format.digits + 1 };
  if (format.kind === 'Fix') return { kind: 'Sci', digits: 1 };
  if (format.digits < 10) return { kind: 'Sci', digits: format.digits + 1 };
  return { kind: 'Norm1' };
}`);
replace('core/runtime.ts',
`    if (entry?.exact) {
      next.screen.decimalEntries ??= next.screen.entries?.map(() => next.screen.showDecimal ?? false);`,
`    if (entry?.exact) {
      const defaultDecimal = next.screen.showDecimal ?? false;
      next.screen.decimalEntries ??= next.screen.entries?.map(() => defaultDecimal);`);
replace('core/catalog.test.ts', 'applyUnitConversion(command.id, 1)', 'applyUnitConversion(1, command.id)');
replace('core/catalog.test.ts', "applyUnitConversion('f_c', 32)", "applyUnitConversion(32, 'f_c')");
replace('core/catalog.test.ts', "applyUnitConversion('c_f', 100)", "applyUnitConversion(100, 'c_f')");
