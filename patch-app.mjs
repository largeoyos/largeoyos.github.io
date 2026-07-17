import fs from 'node:fs';

const file = new URL('./fx-991cn-x-%E7%A7%91%E5%AD%A6%E8%AE%A1%E7%AE%97%E5%99%A8/src/App.tsx', import.meta.url);
const original = fs.readFileSync(file, 'utf8');
const eol = original.includes('\r\n') ? '\r\n' : '\n';
let source = original.replaceAll('\r\n', '\n');

function replaceOnce(before, after, label) {
  const index = source.indexOf(before);
  if (index < 0) throw new Error(`App patch target missing: ${label}`);
  if (source.indexOf(before, index + before.length) >= 0) throw new Error(`App patch target ambiguous: ${label}`);
  source = source.slice(0, index) + after + source.slice(index + before.length);
}

replaceOnce(
  "  solveForVariable,\n  type AngleMode,\n} from './core/calculator';",
  "  solveForVariable,\n  type AngleMode,\n  type NumberFormat,\n  type ResultMode,\n} from './core/calculator';\nimport type { ExactValue } from './core/exact';\nimport { exactValueToFormulaDocument } from './math/exactDisplay';",
  'calculator imports',
);
replaceOnce(
  "const STORAGE_KEY = 'fx991cnx-registers-v1';",
  "const STORAGE_KEY = 'fx991cnx-registers-v1';\nconst PREFERENCES_KEY = 'fx991cnx-preferences-v3';",
  'preferences key',
);
replaceOnce(
  '  const [ans, setAns] = useState<number>(0);\n  const [resultVal, setResultVal] = useState<string>("0");',
  `  const [ans, setAns] = useState<number>(0);
  const [resultVal, setResultVal] = useState<string>("0");
  const [exactAns, setExactAns] = useState<ExactValue>();
  const [currentExact, setCurrentExact] = useState<ExactValue>();
  const [resultDocument, setResultDocument] = useState<FormulaDocument>();
  const [resultMode, setResultMode] = useState<ResultMode>(() => {
    try { return JSON.parse(window.localStorage.getItem(PREFERENCES_KEY) ?? '{}').resultMode === 'decimal' ? 'decimal' : 'exact'; }
    catch { return 'exact'; }
  });
  const [numberFormat, setNumberFormat] = useState<NumberFormat>(() => {
    try { return JSON.parse(window.localStorage.getItem(PREFERENCES_KEY) ?? '{}').numberFormat ?? { kind: 'Norm1' }; }
    catch { return { kind: 'Norm1' }; }
  });`,
  'result settings state',
);
replaceOnce(
  `  }, [modeRuntime.memory]);

  const applyModeAction = (action: RuntimeAction) => {
    const next = dispatchModeRuntime(modeRuntime, action, { variables, ans, angleMode });`,
  `  }, [modeRuntime.memory]);
  useEffect(() => {
    try {
      window.localStorage.setItem(PREFERENCES_KEY, JSON.stringify({ resultMode, numberFormat }));
    } catch {
      // localStorage can be unavailable in private or locked-down contexts.
    }
  }, [resultMode, numberFormat]);

  const applyModeAction = (action: RuntimeAction) => {
    const next = dispatchModeRuntime(modeRuntime, action, {
      variables, ans, angleMode, exactAns, resultMode, numberFormat,
    });`,
  'runtime context',
);
replaceOnce(
  `  const evaluateWithVariables = (formula: string, nextVariables: Record<string, number>) => {
    const evalRes = evaluateExpression(formula, { variables: nextVariables, ans, angleMode });
    if (evalRes.success) {
      setAns(evalRes.value);
      setResultVal(evalRes.displayText);`,
  `  const evaluateWithVariables = (formula: string, nextVariables: Record<string, number>) => {
    const evalRes = evaluateExpression(formula, { variables: nextVariables, ans, angleMode, exactAns, resultMode, numberFormat });
    if (evalRes.success) {
      setAns(evalRes.value);
      setExactAns(evalRes.exact);
      setCurrentExact(evalRes.exact);
      setResultDocument(resultMode === 'exact' && evalRes.exact ? exactValueToFormulaDocument(evalRes.exact) : undefined);
      setResultVal(evalRes.displayText);`,
  'CALC evaluation',
);
replaceOnce(
  `        } else if (activeVal === '4') {
          setResultVal('PIXEL LCD');
          setActiveMenu('NONE');
        } else {`,
  `        } else if (activeVal === '4') {
          const nextMode: ResultMode = resultMode === 'exact' ? 'decimal' : 'exact';
          setResultMode(nextMode);
          setResultDocument(nextMode === 'exact' && currentExact ? exactValueToFormulaDocument(currentExact) : undefined);
          setResultVal(nextMode === 'decimal' && currentExact ? formatCoreValue(ans, numberFormat) : resultVal);
          setActiveMenu('NONE');
        } else if (activeVal === '5') {
          setNumberFormat(previous => previous.kind === 'Norm1' ? { kind: 'Norm2' } : { kind: 'Norm1' });
          setActiveMenu('NONE');
        } else {`,
  'setup settings',
);
replaceOnce(
  `        const selected = SCIENTIFIC_CONSTANTS.find(item => item.key === activeVal);
        if (selected) {
          insertTextAtCursor(String(selected.value));
        }`,
  `        const selected = SCIENTIFIC_CONSTANTS[Number(activeVal) - 1];
        if (selected) {
          insertTextAtCursor(\`const:\${selected.id}:\${selected.symbol}\`);
        }`,
  'scientific constant insertion',
);
replaceOnce(
  `    if (modeRuntime.screen.kind !== 'input' || calcMode !== 'Calculate') {
      if (activeAction === 'menu') {`,
  `    if (modeRuntime.screen.kind !== 'input' || calcMode !== 'Calculate') {
      if (activeAction === 'sd') {
        applyModeAction({ type: 'toggle-result' });
        return;
      }
      if (activeAction === 'menu') {`,
  'mode result toggle',
);
replaceOnce(
  `      case 'sd': {
        const value = resultVal.includes('/') ? ans : Number(resultVal);
        if (Number.isFinite(value)) setResultVal(resultVal.includes('/') ? formatCoreValue(value) : approximateFraction(value));
        break;
      }`,
  `      case 'sd': {
        if (currentExact) {
          setResultDocument(previous => previous ? undefined : exactValueToFormulaDocument(currentExact));
          setResultVal(formatCoreValue(ans, numberFormat));
        }
        break;
      }`,
  'calculate result toggle',
);
replaceOnce(
  `    const evalRes = evaluateExpression(expr, { variables, ans, angleMode });
    if (evalRes.success) {
      setAns(evalRes.value);
      setResultVal(evalRes.displayText);`,
  `    const evalRes = evaluateExpression(expr, { variables, ans, angleMode, exactAns, resultMode, numberFormat });
    if (evalRes.success) {
      setAns(evalRes.value);
      setExactAns(evalRes.exact);
      setCurrentExact(evalRes.exact);
      setResultVal(evalRes.displayText);
      setResultDocument(resultMode === 'exact' && evalRes.exact ? exactValueToFormulaDocument(evalRes.exact) : undefined);
      if (evalRes.assignments) setVariables(previous => ({ ...previous, ...evalRes.assignments }));`,
  'main evaluation',
);
replaceOnce(
  `                    expression={expr}
                    result={resultVal}
                    powerActive={powerActive}`,
  `                    expression={expr}
                    result={resultVal}
                    resultDocument={resultDocument}
                    powerActive={powerActive}`,
  'LCD exact result prop',
);

fs.writeFileSync(file, source.replaceAll('\n', eol), 'utf8');
