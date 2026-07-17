import fs from 'node:fs';
const file = new URL('./patch-app-catalog.mjs', import.meta.url);
let source = fs.readFileSync(file, 'utf8');
source = source
  .replace("if (shiftValue === 'CONST')", "if (shiftValue === 'CONST_MENU')")
  .replace("if (shiftValue === 'CONV')", "if (shiftValue === 'CONV_MENU')");
fs.writeFileSync(file, source, 'utf8');
