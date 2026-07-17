import fs from 'node:fs';

const file = new URL('./fx-991cn-x-%E7%A7%91%E5%AD%A6%E8%AE%A1%E7%AE%97%E5%99%A8/src/App.tsx', import.meta.url);
const original = fs.readFileSync(file, 'utf8');
const eol = original.includes('\r\n') ? '\r\n' : '\n';
let source = original.replaceAll('\r\n', '\n');
function replaceOnce(before, after, label) {
  const index = source.indexOf(before);
  if (index < 0) throw new Error(`App catalog patch target missing: ${label}`);
  source = source.slice(0, index) + after + source.slice(index + before.length);
}

replaceOnce(
  "import type { ExactValue } from './core/exact';",
  `import type { ExactValue } from './core/exact';
import {
  ADVANCED_CATALOG,
  SCIENTIFIC_CONSTANT_CATEGORIES,
  UNIT_CONVERSION_CATEGORIES,
  type ScientificConstantCategory,
  type UnitConversionCategory,
} from './core/catalog';`,
  'catalog imports',
);
replaceOnce(
  "type ActiveMenu = 'NONE' | 'SETUP' | 'CONST' | 'CONV' | 'RECALL' | 'STORE' | 'MAIN' | 'SOLVE' | 'CALC';",
  "type ActiveMenu = 'NONE' | 'SETUP' | 'CONST' | 'CONV' | 'CATALOG' | 'RECALL' | 'STORE' | 'MAIN' | 'SOLVE' | 'CALC';\ntype CatalogPage = { kind: 'root' } | { kind: 'advanced'; index: number } | { kind: 'constant-categories' } | { kind: 'constant-list'; category: ScientificConstantCategory } | { kind: 'conversion-categories' } | { kind: 'conversion-list'; category: UnitConversionCategory };",
  'catalog menu types',
);
replaceOnce(
  `  const [activeMenu, setActiveMenu] = useState<ActiveMenu>('NONE');
  const [menuScrollIdx, setMenuScrollIdx] = useState<number>(0);`,
  `  const [activeMenu, setActiveMenu] = useState<ActiveMenu>('NONE');
  const [menuScrollIdx, setMenuScrollIdx] = useState<number>(0);
  const [catalogPage, setCatalogPage] = useState<CatalogPage>({ kind: 'root' });
  const [catalogIndex, setCatalogIndex] = useState(0);`,
  'catalog state',
);
replaceOnce(
  `  const confirmMenuMode = (index = menuScrollIdx) => {`,
  `  const catalogView = (() => {
    if (catalogPage.kind === 'root') return { title: '高级计算', items: [...ADVANCED_CATALOG.map(item => item.label), '科学常数', '单位换算'] };
    if (catalogPage.kind === 'advanced') return { title: ADVANCED_CATALOG[catalogPage.index].label, items: ADVANCED_CATALOG[catalogPage.index].items.map(item => item.label) };
    if (catalogPage.kind === 'constant-categories') return { title: '科学常数', items: SCIENTIFIC_CONSTANT_CATEGORIES };
    if (catalogPage.kind === 'constant-list') return { title: catalogPage.category, items: SCIENTIFIC_CONSTANTS.filter(item => item.category === catalogPage.category).map(item => \`\${item.symbol}  \${item.name}\`) };
    if (catalogPage.kind === 'conversion-categories') return { title: '单位换算', items: UNIT_CONVERSION_CATEGORIES };
    return { title: catalogPage.category, items: UNIT_CONVERSIONS.filter(item => item.category === catalogPage.category).map(item => item.label) };
  })();
  const catalogPageStart = Math.floor(catalogIndex / 5) * 5;
  const selectCatalogItem = (index = catalogIndex) => {
    if (catalogPage.kind === 'root') {
      if (index < ADVANCED_CATALOG.length) setCatalogPage({ kind: 'advanced', index });
      else if (index === ADVANCED_CATALOG.length) setCatalogPage({ kind: 'constant-categories' });
      else setCatalogPage({ kind: 'conversion-categories' });
      setCatalogIndex(0);
      return;
    }
    if (catalogPage.kind === 'advanced') {
      const item = ADVANCED_CATALOG[catalogPage.index].items[index];
      if (item) insertTextAtCursor(item.insert);
      setActiveMenu('NONE');
      return;
    }
    if (catalogPage.kind === 'constant-categories') {
      const category = SCIENTIFIC_CONSTANT_CATEGORIES[index];
      if (category) { setCatalogPage({ kind: 'constant-list', category }); setCatalogIndex(0); }
      return;
    }
    if (catalogPage.kind === 'constant-list') {
      const item = SCIENTIFIC_CONSTANTS.filter(value => value.category === catalogPage.category)[index];
      if (item) insertTextAtCursor(\`const:\${item.id}:\${item.symbol}\`);
      setActiveMenu('NONE');
      return;
    }
    if (catalogPage.kind === 'conversion-categories') {
      const category = UNIT_CONVERSION_CATEGORIES[index];
      if (category) { setCatalogPage({ kind: 'conversion-list', category }); setCatalogIndex(0); }
      return;
    }
    const item = UNIT_CONVERSIONS.filter(value => value.category === catalogPage.category)[index];
    if (item) insertTextAtCursor(\`conv:\${item.id}:\${item.label}\`);
    setActiveMenu('NONE');
  };

  const confirmMenuMode = (index = menuScrollIdx) => {`,
  'catalog view and actions',
);
replaceOnce(
  `    if (activeMenu !== 'NONE' && ['menu', 'clear', 'backspace', 'shift', 'alpha'].includes(action)) {
      setActiveMenu('NONE');`,
  `    if (activeMenu !== 'NONE' && ['menu', 'clear', 'backspace', 'shift', 'alpha'].includes(action)) {
      if (activeMenu === 'CATALOG' && action === 'backspace' && catalogPage.kind !== 'root') {
        setCatalogPage({ kind: 'root' });
        setCatalogIndex(0);
        return;
      }
      setActiveMenu('NONE');`,
  'catalog back navigation',
);
replaceOnce(
  `        if (shiftValue === 'CONST_MENU') {
          setActiveMenu('CONST');`,
  `        if (shiftValue === 'CONST') {
          setCatalogPage({ kind: 'constant-categories' });
          setCatalogIndex(0);
          setActiveMenu('CATALOG');`,
  'constant shortcut',
);
replaceOnce(
  `        if (shiftValue === 'CONV_MENU') {
          setActiveMenu('CONV');`,
  `        if (shiftValue === 'CONV') {
          setCatalogPage({ kind: 'conversion-categories' });
          setCatalogIndex(0);
          setActiveMenu('CATALOG');`,
  'conversion shortcut',
);
replaceOnce(
  `    if (activeMenu !== 'NONE') {
      if (activeMenu === 'MAIN') {`,
  `    if (activeMenu !== 'NONE') {
      if (activeMenu === 'CATALOG') {
        const length = catalogView.items.length;
        if (/^[1-5]$/.test(activeVal)) selectCatalogItem(catalogPageStart + Number(activeVal) - 1);
        else if (activeAction === 'arrow_up' || activeAction === 'arrow_left') setCatalogIndex(previous => (previous - 1 + length) % length);
        else if (activeAction === 'arrow_down' || activeAction === 'arrow_right') setCatalogIndex(previous => (previous + 1) % length);
        else if (activeAction === 'evaluate') selectCatalogItem();
        return;
      }
      if (activeMenu === 'MAIN') {`,
  'catalog controls',
);
replaceOnce(
  `    if (activeAction === 'optn') {
      applyModeAction({ type: 'optn' });
      return;
    }`,
  `    if (activeAction === 'optn') {
      if (calcMode === 'Calculate' && modeRuntime.screen.kind === 'input') {
        setCatalogPage({ kind: 'root' });
        setCatalogIndex(0);
        setActiveMenu('CATALOG');
      } else applyModeAction({ type: 'optn' });
      return;
    }`,
  'OPTN catalog opening',
);
replaceOnce(
  `      case 'optn':
        applyModeAction({ type: 'optn' });
        break;`,
  `      case 'optn':
        setCatalogPage({ kind: 'root' });
        setCatalogIndex(0);
        setActiveMenu('CATALOG');
        break;`,
  'calculate OPTN route',
);
replaceOnce(
  `                    variables={variables}
                    modeScreen={runtimeScreenView(modeRuntime)}`,
  `                    variables={variables}
                    listTitle={activeMenu === 'CATALOG' ? catalogView.title : undefined}
                    listItems={activeMenu === 'CATALOG' ? catalogView.items.slice(catalogPageStart, catalogPageStart + 5).map((item, index) => \`\${index + 1} \${item}\`) : undefined}
                    listSelectedIndex={activeMenu === 'CATALOG' ? catalogIndex - catalogPageStart : undefined}
                    modeScreen={runtimeScreenView(modeRuntime)}`,
  'catalog LCD props',
);
replaceOnce(
  `                      if (activeMenu === 'MAIN') confirmMenuMode(index);
                      else handleKeypress('append', String(index + 1));`,
  `                      if (activeMenu === 'MAIN') confirmMenuMode(index);
                      else if (activeMenu === 'CATALOG') selectCatalogItem(catalogPageStart + index);
                      else handleKeypress('append', String(index + 1));`,
  'catalog touch selection',
);

fs.writeFileSync(file, source.replaceAll('\n', eol), 'utf8');
