import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  History, 
  HelpCircle, 
  Database, 
  Sliders, 
  RefreshCcw, 
  Check, 
  ChevronRight, 
  Volume2, 
  VolumeX, 
  Coffee 
} from 'lucide-react';
import {
  APP_CAPABILITIES,
  SCIENTIFIC_CONSTANTS,
  UNIT_CONVERSIONS,
  convertUnit,
  evaluateExpression,
  factorizeInteger,
  formatCasioValue as formatCoreValue,
  solveForVariable,
  type AngleMode,
  type NumberFormat,
  type ResultMode,
} from './core/calculator';
import type { ExactValue } from './core/exact';
import {
  ADVANCED_CATALOG,
  SCIENTIFIC_CONSTANT_CATEGORIES,
  UNIT_CONVERSION_CATEGORIES,
  type ScientificConstantCategory,
  type UnitConversionCategory,
} from './core/catalog';
import { exactValueToFormulaDocument } from './math/exactDisplay';
import {
  FormulaLcd,
  type FormulaLcdHandle,
} from './math/FormulaLcd';
import {
  createModeRuntime,
  dispatchModeRuntime,
  runtimeScreenView,
  type RuntimeAction,
} from './core/runtime';
import {
  loadModeMemory,
  MODE_MEMORY_KEY,
  type CalcMode,
} from './core/modes';
import type { FormulaDocument } from './math/ast';

function formatEngineering(value: number): string {
  if (!Number.isFinite(value) || value === 0) return formatCoreValue(value);
  const exponent = Math.floor(Math.log10(Math.abs(value)) / 3) * 3;
  const mantissa = value / 10 ** exponent;
  return exponent === 0 ? formatCoreValue(mantissa) : `${formatCoreValue(mantissa)}×10^${exponent}`;
}

function cycleNumberFormat(format: NumberFormat): NumberFormat {
  if (!('digits' in format)) return format.kind === 'Norm1' ? { kind: 'Norm2' } : { kind: 'Fix', digits: 0 };
  if (format.kind === 'Fix' && format.digits < 9) return { kind: 'Fix', digits: format.digits + 1 };
  if (format.kind === 'Fix') return { kind: 'Sci', digits: 1 };
  if (format.digits < 10) return { kind: 'Sci', digits: format.digits + 1 };
  return { kind: 'Norm1' };
}

function approximateFraction(value: number, maxDenominator = 100000): string {
  if (!Number.isFinite(value)) return 'Math ERROR';
  const sign = value < 0 ? -1 : 1;
  let x = Math.abs(value);
  let h1 = 1, h0 = 0, k1 = 0, k0 = 1;
  while (true) {
    const a = Math.floor(x);
    const h2 = a * h1 + h0;
    const k2 = a * k1 + k0;
    if (k2 > maxDenominator) break;
    h0 = h1; h1 = h2; k0 = k1; k1 = k2;
    const remainder = x - a;
    if (remainder < 1e-12) break;
    x = 1 / remainder;
  }
  return k1 === 1 ? String(sign * h1) : `${sign * h1}/${k1}`;
}
type ActiveMenu = 'NONE' | 'SETUP' | 'CONST' | 'CONV' | 'CATALOG' | 'RECALL' | 'STORE' | 'MAIN' | 'SOLVE' | 'CALC';
type CatalogPage = { kind: 'root' } | { kind: 'advanced'; index: number } | { kind: 'constant-categories' } | { kind: 'constant-list'; category: ScientificConstantCategory } | { kind: 'conversion-categories' } | { kind: 'conversion-list'; category: UnitConversionCategory };
type MenuDirection = 'left' | 'right' | 'up' | 'down';

const STORAGE_KEY = 'fx991cnx-registers-v1';
const PREFERENCES_KEY = 'fx991cnx-preferences-v3';
const VARIABLE_NAMES = ['A', 'B', 'C', 'D', 'E', 'F', 'X', 'Y', 'M'];
const DEFAULT_VARIABLES: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0, X: 0, Y: 0, M: 0 };
const MODE_LABELS: Record<CalcMode, string> = {
  Calculate: '计算',
  Statistics: '统计',
  'Function Table': '函数表格',
  Equation: '函数/方程',
  Inequality: '不等式',
  Complex: '复数',
  'Base-N': '基数',
  Matrix: '矩阵',
  Vector: '向量',
  Ratio: '比例',
};
const MENU_MODES: CalcMode[] = [
  'Calculate',
  'Complex',
  'Base-N',
  'Matrix',
  'Vector',
  'Statistics',
  'Function Table',
  'Equation',
  'Inequality',
  'Ratio',
];

function loadStoredVariables(): Record<string, number> {
  if (typeof window === 'undefined') return DEFAULT_VARIABLES;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_VARIABLES;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return VARIABLE_NAMES.reduce((acc, name) => {
      const value = Number(parsed[name]);
      acc[name] = Number.isFinite(value) ? value : 0;
      return acc;
    }, { ...DEFAULT_VARIABLES });
  } catch {
    return DEFAULT_VARIABLES;
  }
}

function extractVariables(input: string): string[] {
  const found = new Set<string>();
  for (const match of input.matchAll(/\b[A-FXYM]\b/g)) {
    found.add(match[0].toUpperCase());
  }
  return [...found];
}

// --- MAIN APP ---
export default function App() {
  // Calculator logical states
  const [powerActive, setPowerActive] = useState<boolean>(true);
  const [expr, setExpr] = useState<string>("");
  const [cursorIdx, setCursorIdx] = useState<number>(0);
  const [ans, setAns] = useState<number>(0);
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
  });
  const [variables, setVariables] = useState<Record<string, number>>(() => loadStoredVariables());
  const [calcMode, setCalcMode] = useState<CalcMode>('Calculate');
  const [modeRuntime, setModeRuntime] = useState(() => createModeRuntime(loadModeMemory()));

  // Mode helpers
  const [shiftActive, setShiftActive] = useState<boolean>(false);
  const [alphaActive, setAlphaActive] = useState<boolean>(false);
  const [angleMode, setAngleMode] = useState<AngleMode>('DEG');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Advanced contextual screens
  const [activeMenu, setActiveMenu] = useState<ActiveMenu>('NONE');
  const [menuScrollIdx, setMenuScrollIdx] = useState<number>(0);
  const [catalogPage, setCatalogPage] = useState<CatalogPage>({ kind: 'root' });
  const [catalogIndex, setCatalogIndex] = useState(0);
  const [historyList, setHistoryList] = useState<Array<{ expr: string; res: string; timestamp: string; ast?: FormulaDocument }>>([
    { expr: "sin(30) × 4", res: "2", timestamp: "15:20" },
    { expr: "5! + 10", res: "130", timestamp: "15:18" }
  ]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [solutionList, setSolutionList] = useState<number[]>([]);
  const [solutionIndex, setSolutionIndex] = useState(0);
  const [solutionVariable, setSolutionVariable] = useState('X');

  // Sidebar / Interactive variables panel
  const [activeTab, setActiveTab] = useState<'history' | 'variables' | 'manual'>('history');

  // Input textbox reference
  const containerRef = useRef<HTMLDivElement>(null);
  const formulaLcdRef = useRef<FormulaLcdHandle | null>(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(variables));
    } catch {
      // localStorage can be unavailable in private or locked-down contexts.
    }
  }, [variables]);
  useEffect(() => {
    try {
      window.localStorage.setItem(MODE_MEMORY_KEY, JSON.stringify(modeRuntime.memory));
    } catch {
      // localStorage can be unavailable in private or locked-down contexts.
    }
  }, [modeRuntime.memory]);
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
    });
    setModeRuntime(next);
    setExpr(next.input);
    setResultVal(next.result);
    if (next.result === 'DEG' || next.result === 'RAD' || next.result === 'GRAD') setAngleMode(next.result);
    return next;
  };

  // Physical Sound Synthesizer via Web Audio API
  const triggerClickAudio = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, audioCtx.currentTime); // High pitch tactile click
      osc.frequency.exponentialRampToValueAtTime(150, audioCtx.currentTime + 0.04);
      
      gainNode.gain.setValueAtTime(0.015, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.04);
      
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      osc.start();
      osc.stop(audioCtx.currentTime + 0.04);
    } catch {
      // Ignored if browser block constraints met
    }
  };

  const evaluateWithVariables = (formula: string, nextVariables: Record<string, number>) => {
    const evalRes = evaluateExpression(formula, { variables: nextVariables, ans, angleMode, exactAns, resultMode, numberFormat });
    if (evalRes.success) {
      setAns(evalRes.value);
      setExactAns(evalRes.exact);
      setCurrentExact(evalRes.exact);
      setResultDocument(resultMode === 'exact' && evalRes.exact ? exactValueToFormulaDocument(evalRes.exact) : undefined);
      setResultVal(evalRes.displayText);
      const date = new Date();
      const timestamp = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
      setHistoryList(prev => [
        { expr: formula, res: evalRes.displayText, timestamp, ast: formulaLcdRef.current?.getDocument() },
        ...prev.slice(0, 19)
      ]);
    } else {
      setResultVal(evalRes.displayText);
    }
  };

  const storeCurrentResultTo = (name: string) => {
    const value = Number(resultVal);
    if (!Number.isFinite(value)) {
      setResultVal("Syntax ERROR");
      return;
    }
    setVariables(prev => ({ ...prev, [name]: value }));
    setResultVal(`Stored ${name}=${formatCoreValue(value)}`);
  };

  const runSolveFor = (name: string) => {
    const solveRes = solveForVariable(expr, name, { variables, ans, angleMode });
    if (solveRes.success) {
      const roots = solveRes.roots ?? [solveRes.value];
      setSolutionList(roots);
      setSolutionIndex(0);
      setSolutionVariable(name);
      setAns(solveRes.value);
      setVariables(prev => ({ ...prev, [name]: solveRes.value }));
      setResultVal(solveRes.displayText);
    } else {
      setResultVal(solveRes.displayText);
    }
    setActiveMenu('NONE');
  };

  const showSolution = (index: number) => {
    if (solutionList.length === 0) return;
    const nextIndex = Math.max(0, Math.min(solutionList.length - 1, index));
    const value = solutionList[nextIndex];
    setSolutionIndex(nextIndex);
    setAns(value);
    setVariables(prev => ({ ...prev, [solutionVariable]: value }));
    setResultVal(`${solutionVariable}${nextIndex + 1}=${formatCoreValue(value)} [${nextIndex + 1}/${solutionList.length}]`);
  };

  const browseHistory = (direction: 'up' | 'down') => {
    if (historyList.length === 0) return;
    const nextIndex = direction === 'up'
      ? Math.min(historyList.length - 1, historyIndex + 1)
      : Math.max(-1, historyIndex - 1);
    setHistoryIndex(nextIndex);
    if (nextIndex < 0) return;
    const item = historyList[nextIndex];
    if (item.ast) formulaLcdRef.current?.loadDocument(item.ast);
    else formulaLcdRef.current?.loadExpression(item.expr);
    setExpr(item.expr);
    setCursorIdx(item.expr.length);
    setResultVal(item.res);
  };

  const handleSolveRequest = () => {
    if (!expr.includes('=')) {
      setResultVal("Solve needs =");
      return;
    }
    const vars = formulaLcdRef.current?.getVariables() ?? extractVariables(expr);
    if (vars.length === 0) {
      setResultVal("No variable");
      return;
    }
    if (vars.length === 1) {
      runSolveFor(vars[0]);
      return;
    }
    setActiveMenu('SOLVE');
    setResultVal(`Solve: ${vars.join('/')}`);
  };

  const handleCalcRequest = () => {
    if (expr.includes('=')) {
      setResultVal("Use SOLVE");
      return;
    }
    const vars = formulaLcdRef.current?.getVariables() ?? extractVariables(expr);
    if (vars.length === 0) {
      handleEvaluation();
      return;
    }
    const nextVariables = { ...variables };
    for (const name of vars) {
      const raw = window.prompt(`CALC: ${name}=`, String(nextVariables[name] ?? 0));
      if (raw === null) {
        setResultVal("CALC canceled");
        return;
      }
      const value = Number(raw);
      if (!Number.isFinite(value)) {
        setResultVal("Argument ERROR");
        return;
      }
      nextVariables[name] = value;
    }
    setVariables(nextVariables);
    evaluateWithVariables(expr, nextVariables);
  };

  const catalogView = (() => {
    if (catalogPage.kind === 'root') return { title: '高级计算', items: [...ADVANCED_CATALOG.map(item => item.label), '科学常数', '单位换算'] };
    if (catalogPage.kind === 'advanced') return { title: ADVANCED_CATALOG[catalogPage.index].label, items: ADVANCED_CATALOG[catalogPage.index].items.map(item => item.label) };
    if (catalogPage.kind === 'constant-categories') return { title: '科学常数', items: SCIENTIFIC_CONSTANT_CATEGORIES };
    if (catalogPage.kind === 'constant-list') return { title: catalogPage.category, items: SCIENTIFIC_CONSTANTS.filter(item => item.category === catalogPage.category).map(item => `${item.symbol}  ${item.name}`) };
    if (catalogPage.kind === 'conversion-categories') return { title: '单位换算', items: UNIT_CONVERSION_CATEGORIES };
    return { title: catalogPage.category, items: UNIT_CONVERSIONS.filter(item => item.category === catalogPage.category).map(item => item.label) };
  })();
  const catalogPageStart = Math.floor(catalogIndex / 4) * 4;
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
      if (item) insertTextAtCursor(`const:${item.id}:${item.symbol}`);
      setActiveMenu('NONE');
      return;
    }
    if (catalogPage.kind === 'conversion-categories') {
      const category = UNIT_CONVERSION_CATEGORIES[index];
      if (category) { setCatalogPage({ kind: 'conversion-list', category }); setCatalogIndex(0); }
      return;
    }
    const item = UNIT_CONVERSIONS.filter(value => value.category === catalogPage.category)[index];
    if (item) insertTextAtCursor(`conv:${item.id}:${item.label}`);
    setActiveMenu('NONE');
  };

  const confirmMenuMode = (index = menuScrollIdx) => {
    const mode = MENU_MODES[index];
    if (!mode) return;
    setCalcMode(mode);
    const next = dispatchModeRuntime(modeRuntime, { type: 'select-mode', mode }, { variables, ans, angleMode, exactAns, resultMode, numberFormat });
    setModeRuntime(next);
    setExpr(next.input);
    setResultVal(next.result);
    setActiveMenu('NONE');
  };

  const moveMenuSelection = (direction: MenuDirection) => {
    setMenuScrollIdx(prev => {
      if (direction === 'left') return (prev - 1 + MENU_MODES.length) % MENU_MODES.length;
      if (direction === 'right') return (prev + 1) % MENU_MODES.length;
      const column = prev % 4;
      const sameColumn = MENU_MODES
        .map((_, index) => index)
        .filter(index => index % 4 === column);
      const position = sameColumn.indexOf(prev);
      const delta = direction === 'up' ? -1 : 1;
      return sameColumn[(position + delta + sameColumn.length) % sameColumn.length];
    });
  };

  // Handle keys inputs on the virtual keypads
  const handleKeypress = (action: string, value?: string, shiftValue?: string, alphaValue?: string) => {
    triggerClickAudio();

    if (modeRuntime.screen.kind === 'menu' && ['menu', 'clear', 'backspace', 'shift', 'alpha'].includes(action)) {
      applyModeAction({ type: 'clear' });
      setShiftActive(false);
      setAlphaActive(false);
      return;
    }

    if (activeMenu !== 'NONE' && ['menu', 'clear', 'backspace', 'shift', 'alpha'].includes(action)) {
      if (activeMenu === 'CATALOG' && action === 'backspace' && catalogPage.kind !== 'root') {
        setCatalogPage({ kind: 'root' });
        setCatalogIndex(0);
        return;
      }
      setActiveMenu('NONE');
      setShiftActive(false);
      setAlphaActive(false);
      return;
    }

    // 1. Shifting layers logic
    let activeAction = action;
    let activeVal = value ?? "";

    if (shiftActive) {
      if (shiftValue) {
        activeAction = 'append';
        activeVal = shiftValue;
        if (shiftValue === 'OFF') {
          setPowerActive(false);
          setExpr("");
          setResultVal("");
          setShiftActive(false);
          setAlphaActive(false);
          return;
        }
        if (shiftValue === 'SETUP') {
          setActiveMenu('SETUP');
          setShiftActive(false);
          return;
        }
        if (shiftValue === 'SOLVE') {
          setShiftActive(false);
          handleSolveRequest();
          return;
        }
        if (shiftValue === 'RESET') {
          // Perform total reset
          setVariables({ ...DEFAULT_VARIABLES });
          setAns(0);
          setExpr("");
          setResultVal("初始化完毕!");
          setShiftActive(false);
          return;
        }
        if (shiftValue === 'FACT') {
          const factorsStr = factorizeInteger(resultVal);
          if (factorsStr) {
            const source = resultVal.trim().split('=')[0];
            setResultVal(`${source}=${factorsStr}`);
          } else {
            setResultVal('Math ERROR');
          }
          setShiftActive(false);
          return;
        }
        if (shiftValue === 'CONST') {
          setCatalogPage({ kind: 'constant-categories' });
          setCatalogIndex(0);
          setActiveMenu('CATALOG');
          setShiftActive(false);
          return;
        }
        if (shiftValue === 'CONV') {
          setCatalogPage({ kind: 'conversion-categories' });
          setCatalogIndex(0);
          setActiveMenu('CATALOG');
          setShiftActive(false);
          return;
        }
        if (shiftValue === 'M-') {
          const value = Number(resultVal);
          if (Number.isFinite(value)) setVariables(prev => ({ ...prev, M: prev.M - value }));
          setShiftActive(false);
          return;
        }
        if (shiftValue === 'RECALL') {
          setActiveMenu('RECALL');
          setShiftActive(false);
          return;
        }
      }
      setShiftActive(false);
    } else if (alphaActive) {
      if (alphaValue) {
        activeAction = 'append';
        activeVal = alphaValue;
      }
      setAlphaActive(false);
    }

    // Power safeguard: If calculator is off, only ON / AC turns it on!
    if (!powerActive) {
      if (activeAction === 'clear' || activeAction === 'on') {
        setPowerActive(true);
        setExpr("");
        setResultVal("0");
      }
      return;
    }

    // Contextual menu selection triggers
    if (activeMenu !== 'NONE') {
      if (activeMenu === 'CATALOG') {
        const length = catalogView.items.length;
        if (/^[1-4]$/.test(activeVal)) selectCatalogItem(catalogPageStart + Number(activeVal) - 1);
        else if (activeAction === 'arrow_up' || activeAction === 'arrow_left') setCatalogIndex(previous => (previous - 1 + length) % length);
        else if (activeAction === 'arrow_down' || activeAction === 'arrow_right') setCatalogIndex(previous => (previous + 1) % length);
        else if (activeAction === 'evaluate') selectCatalogItem();
        return;
      }
      if (activeMenu === 'MAIN') {
        if (/^\d$/.test(activeVal)) {
          const numeric = Number(activeVal);
          const idx = numeric === 0 ? 9 : numeric - 1;
          if (MENU_MODES[idx]) {
            confirmMenuMode(idx);
            return;
          }
        }
        if (activeAction === 'arrow_left') moveMenuSelection('left');
        if (activeAction === 'arrow_right') moveMenuSelection('right');
        if (activeAction === 'arrow_up') moveMenuSelection('up');
        if (activeAction === 'arrow_down') moveMenuSelection('down');
        if (activeAction === 'evaluate') confirmMenuMode();
        return;
      }

      if (activeMenu === 'SOLVE') {
        if (VARIABLE_NAMES.includes(activeVal)) {
          runSolveFor(activeVal);
          return;
        }
        const idx = Number(activeVal) - 1;
        const vars = formulaLcdRef.current?.getVariables() ?? extractVariables(expr);
        if (Number.isInteger(idx) && vars[idx]) {
          runSolveFor(vars[idx]);
          return;
        }
        setActiveMenu('NONE');
        return;
      }
      if (activeMenu === 'CALC') {
        handleCalcRequest();
        setActiveMenu('NONE');
        return;
      }
      if (activeMenu === 'SETUP') {
        if (activeVal === '1') {
          setAngleMode('DEG');
          setActiveMenu('NONE');
        } else if (activeVal === '2') {
          setAngleMode('RAD');
          setActiveMenu('NONE');
        } else if (activeVal === '3') {
          setAngleMode('GRAD');
          setActiveMenu('NONE');
        } else if (activeVal === '4') {
          const nextMode: ResultMode = resultMode === 'exact' ? 'decimal' : 'exact';
          setResultMode(nextMode);
          setResultDocument(nextMode === 'exact' && currentExact ? exactValueToFormulaDocument(currentExact) : undefined);
          setResultVal(nextMode === 'decimal' && currentExact ? formatCoreValue(ans, numberFormat) : resultVal);
          setActiveMenu('NONE');
        } else if (activeVal === '5') {
          setNumberFormat(previous => cycleNumberFormat(previous));
          setActiveMenu('NONE');
        } else {
          setActiveMenu('NONE');
        }
        return;
      }
      if (activeMenu === 'CONST') {
        // Physical Constants standard
        const selected = SCIENTIFIC_CONSTANTS[Number(activeVal) - 1];
        if (selected) {
          insertTextAtCursor(`const:${selected.id}:${selected.symbol}`);
        }
        setActiveMenu('NONE');
        return;
      }
      if (activeMenu === 'CONV') {
        // Simple unit converters
        const currentNum = Number(resultVal) || 0;
        const converted = convertUnit(currentNum, activeVal);
        if (converted) {
          setResultVal(converted);
        }
        setActiveMenu('NONE');
        return;
      }
      if (activeMenu === 'RECALL') {
        // Variable recall
        if (['A', 'B', 'C', 'D', 'E', 'F', 'X', 'Y', 'M'].includes(activeVal)) {
          insertTextAtCursor(activeVal);
        }
        setActiveMenu('NONE');
        return;
      }
      if (activeMenu === 'STORE') {
        // Variable store
        if (VARIABLE_NAMES.includes(activeVal)) {
          storeCurrentResultTo(activeVal);
        }
        setActiveMenu('NONE');
        return;
      }
      setActiveMenu('NONE');
      return;
    }

    // Layer toggles must work in every input mode; menus above already use them as exits.
    if (activeAction === 'shift') {
      setShiftActive(prev => !prev);
      setAlphaActive(false);
      return;
    }
    if (activeAction === 'alpha') {
      setAlphaActive(prev => !prev);
      setShiftActive(false);
      return;
    }

    // Mode-specific actions are handled before the general calculator router.
    if (activeAction === 'optn') {
      if (calcMode === 'Calculate' && modeRuntime.screen.kind === 'input') {
        setCatalogPage({ kind: 'root' });
        setCatalogIndex(0);
        setActiveMenu('CATALOG');
      } else applyModeAction({ type: 'optn' });
      return;
    }
    if (modeRuntime.screen.kind !== 'input' || calcMode !== 'Calculate') {
      if (activeAction === 'sd') {
        applyModeAction({ type: 'toggle-result' });
        return;
      }
      if (activeAction === 'menu') {
        setMenuScrollIdx(Math.max(0, MENU_MODES.indexOf(calcMode)));
        setActiveMenu('MAIN');
        return;
      }
      if (activeAction === 'clear') applyModeAction({ type: 'clear' });
      else if (activeAction === 'backspace') applyModeAction({ type: 'delete' });
      else if (activeAction === 'arrow_left') applyModeAction({ type: 'left' });
      else if (activeAction === 'arrow_right') applyModeAction({ type: 'right' });
      else if (activeAction === 'arrow_up') applyModeAction({ type: 'up' });
      else if (activeAction === 'arrow_down') applyModeAction({ type: 'down' });
      else if (activeAction === 'evaluate') applyModeAction({ type: 'evaluate' });
      else if (activeAction === 'eng') applyModeAction({ type: 'eng' });
      else if (activeAction === 'append') {
        const baseKeys: Record<string, 2 | 8 | 10 | 16> = { '²': 10, '^(': 16, 'log□(': 2, 'ln(': 8 };
        if (calcMode === 'Base-N' && baseKeys[activeVal]) applyModeAction({ type: 'base', base: baseKeys[activeVal] });
        else applyModeAction({ type: 'append', value: activeVal });
      }
      return;
    }

    // --- BUTTON EVENT ROUTER ---
    switch (activeAction) {

      case 'clear':
        formulaLcdRef.current?.clear();
        setExpr("");
        setResultVal("0");
        setCursorIdx(0);
        setHistoryIndex(-1);
        setSolutionList([]);
        break;
      case 'backspace':
        if (formulaLcdRef.current) {
          formulaLcdRef.current.deleteBackward();
          break;
        }
        if (expr.length > 0 && cursorIdx > 0) {
          const before = expr.slice(0, cursorIdx - 1);
          const after = expr.slice(cursorIdx);
          setExpr(before + after);
          setCursorIdx(cursorIdx - 1);
        }
        break;
      case 'arrow_left':
        if (formulaLcdRef.current?.moveResult('left')) break;
        if (formulaLcdRef.current) {
          formulaLcdRef.current.move('left');
          break;
        }
        setCursorIdx(prev => Math.max(0, prev - 1));
        break;
      case 'arrow_right':
        if (formulaLcdRef.current?.moveResult('right')) break;
        if (formulaLcdRef.current) {
          formulaLcdRef.current.move('right');
          break;
        }
        setCursorIdx(prev => Math.min(expr.length, prev + 1));
        break;
      case 'arrow_up':
        if (solutionList.length > 1) {
          showSolution(solutionIndex - 1);
          break;
        }
        if (!formulaLcdRef.current?.move('up')) browseHistory('up');
        break;
      case 'arrow_down':
        if (solutionList.length > 1) {
          showSolution(solutionIndex + 1);
          break;
        }
        if (!formulaLcdRef.current?.move('down')) browseHistory('down');
        break;
      case 'menu':
        setMenuScrollIdx(Math.max(0, MENU_MODES.indexOf(calcMode)));
        setActiveMenu('MAIN');
        break;
      case 'optn':
        setCatalogPage({ kind: 'root' });
        setCatalogIndex(0);
        setActiveMenu('CATALOG');
        break;
      case 'calc':
        handleCalcRequest();
        break;
      case 'solve':
        handleSolveRequest();
        break;
      case 'store_mode':
        setActiveMenu('STORE');
        break;
      case 'eng': {
        const value = Number(resultVal);
        if (Number.isFinite(value)) setResultVal(formatEngineering(value));
        break;
      }
      case 'sd': {
        if (currentExact) {
          setResultDocument(previous => previous ? undefined : exactValueToFormulaDocument(currentExact));
          setResultVal(formatCoreValue(ans, numberFormat));
        }
        break;
      }
      case 'mplus': {
        const value = Number(resultVal);
        if (Number.isFinite(value)) setVariables(prev => ({ ...prev, M: prev.M + value }));
        break;
      }
      case 'evaluate':
        handleEvaluation();
        break;
      case 'append':
        insertTextAtCursor(activeVal);
        break;
      case 'change_angle':
        setAngleMode(prev => prev === 'DEG' ? 'RAD' : prev === 'RAD' ? 'GRAD' : 'DEG');
        break;
    }
  };

  const insertTextAtCursor = (txt: string) => {
    setHistoryIndex(-1);
    setSolutionList([]);
    if (formulaLcdRef.current) {
      formulaLcdRef.current.insertInput(txt);
      return;
    }
    const plainText = txt === 'log□(' ? 'log(' : txt;
    const before = expr.slice(0, cursorIdx);
    const after = expr.slice(cursorIdx);
    setExpr(before + plainText + after);
    setCursorIdx(cursorIdx + plainText.length);
  };

  const handleEvaluation = () => {
    setHistoryIndex(-1);
    setSolutionList([]);
    const evalRes = evaluateExpression(expr, { variables, ans, angleMode, exactAns, resultMode, numberFormat });
    if (evalRes.success) {
      setAns(evalRes.value);
      setExactAns(evalRes.exact);
      setCurrentExact(evalRes.exact);
      setResultVal(evalRes.displayText);
      setResultDocument(resultMode === 'exact' && evalRes.exact ? exactValueToFormulaDocument(evalRes.exact) : undefined);
      if (evalRes.assignments) setVariables(previous => ({ ...previous, ...evalRes.assignments }));
      
      // Save history log
      const date = new Date();
      const timestamp = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
      setHistoryList(prev => [
        { expr, res: evalRes.displayText, timestamp, ast: formulaLcdRef.current?.getDocument() },
        ...prev.slice(0, 19)
      ]);
    } else {
      setResultVal(evalRes.displayText); // Shows ERROR string
    }
  };

  // Native keyboard inputs handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!powerActive) return;
      if (document.activeElement?.tagName === 'INPUT') return;

      if (e.key >= '0' && e.key <= '9') {
        handleKeypress('append', e.key);
      } else if (e.key === '.') {
        handleKeypress('append', '.');
      } else if (e.key === '+') {
        handleKeypress('append', '+');
      } else if (e.key === '-') {
        handleKeypress('append', '-');
      } else if (e.key === '*') {
        handleKeypress('append', '×');
      } else if (e.key === '/') {
        handleKeypress('append', '÷');
      } else if (e.key === 'Enter' || e.key === '=') {
        handleKeypress('evaluate');
      } else if (e.key === 'Backspace') {
        handleKeypress('backspace');
      } else if (e.key === 'Escape') {
        handleKeypress('clear');
      } else if (e.key === 'ArrowLeft') {
        handleKeypress('arrow_left');
      } else if (e.key === 'ArrowRight') {
        handleKeypress('arrow_right');
      } else if (e.key === 'ArrowUp') {
        handleKeypress('arrow_up');
      } else if (e.key === 'ArrowDown') {
        handleKeypress('arrow_down');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    expr,
    cursorIdx,
    variables,
    ans,
    angleMode,
    powerActive,
    historyList,
    historyIndex,
    solutionList,
    solutionIndex,
    solutionVariable,
  ]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans flex flex-col selection:bg-teal-500 selection:text-slate-900">
      
      {/* Top Professional Decorative Header */}
      <header className="bg-slate-950 border-b border-slate-800 py-3 px-6 shadow-md flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center font-black text-slate-900 text-sm shadow-inner shadow-teal-400">
            991
          </div>
          <div>
            <span className="font-bold text-slate-100 tracking-tight text-md">fx-991CN X 科学计算器</span>
            <span className="hidden sm:inline-block ml-3 px-2 py-0.5 rounded text-[10px] bg-teal-950 text-teal-400 border border-teal-800 font-mono font-semibold">
              CLASSWIZ EMULATOR v1.14.0
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setSoundEnabled(!soundEnabled)} 
            className={`p-2 rounded-lg transition-colors border ${soundEnabled ? 'bg-teal-950 border-teal-800 text-teal-400' : 'bg-slate-900 border-slate-800 text-slate-400'}`}
            title={soundEnabled ? "声音开启" : "静音模式"}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
          
          <a 
            href="#manual"
            onClick={() => setActiveTab('manual')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-xs text-slate-300 transition-all font-medium"
          >
            <HelpCircle size={14} className="text-teal-400" />
            使用指南
          </a>
        </div>
      </header>

      {/* Main Container Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden">
        
        {/* LEFT COLUMN: THE PHYSICAL CASIO CALCULATOR BODY */}
        <div className="lg:col-span-5 xl:col-span-4 flex justify-center items-start lg:sticky lg:top-6">
          <div className="relative w-full max-w-[390px] bg-[#161a22] rounded-[30px] rounded-b-[48px] border-[4px] border-[#2d3340] shadow-2xl p-4 flex flex-col gap-4 select-none">
            
            {/* Fine carbon weave texture overlay */}
            <div 
              className="absolute inset-0 rounded-[26px] rounded-b-[44px] pointer-events-none opacity-[0.03] z-[2]"
              style={{
                backgroundImage: 'repeating-conic-gradient(#fff 0% 25%, transparent 25% 50%, #fff 50% 75%, transparent 75% 100%)',
                backgroundSize: '8px 8px'
              }}
            />

            {/* CASIO Brand Row & Holographic gold badge / Solar cell */}
            <div className="flex justify-between items-start pt-1 px-1 z-[3]">
              <div className="flex flex-col">
                <span className="text-white text-xl font-bold tracking-tight leading-none text-shadow-sm font-sans">
                  CASIO
                </span>
                <span className="text-slate-300 font-bold text-[10px] mt-1 leading-none">
                  fx-991CN X 中文版
                </span>
                <span className="text-[#cf5a7e] font-black text-xs mt-1 tracking-[2px] leading-none">
                  CLASSWIZ
                </span>
              </div>

              {/* Solar Strip representation */}
              <div 
                className="w-24 h-11 rounded border border-black/85 bg-[#3a2216] relative overflow-hidden shadow-inner flex items-center justify-around p-1"
                title="太阳能电池板 (模拟)"
              >
                <div className="absolute inset-y-0 left-0 right-0 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
                <div className="w-1/4 h-full bg-[#351e12] border-r border-[#190e09]" />
                <div className="w-1/4 h-full bg-[#311c10] border-r border-[#190e09]" />
                <div className="w-1/4 h-full bg-[#2d1a0e] border-r border-[#190e09]" />
                <div className="w-1/4 h-full bg-[#2c190d]" />
              </div>

              {/* Holographic vertical gold security sticker */}
              <div className="w-7 bg-gradient-to-b from-[#caa644] via-[#ac832e] to-[#8d691f] text-slate-900 border border-[#ac832e] rounded px-[3px] py-1 text-[8px] font-bold text-center leading-tight tracking-tighter shrink-0 select-none shadow">
                <div className="bg-yellow-300/35 text-[6px] rounded px-[1px] font-sans scale-90 mb-0.5">
                  正品
                </div>
                函数卡
              </div>
            </div>

            {/* Screen border & Retroreflective Matrix LCD */}
            <div className="px-1 z-[3]">
              <div className="bg-slate-950 p-2.5 rounded-xl shadow-inner border border-slate-900/60 relative">
                <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-28 h-0.5 bg-slate-800/80 rounded-full" />
                
                {/* LCD Display Block */}
                <div 
                  className="w-full min-h-[114px] bg-[#a9ba96] rounded text-[#1a251b] font-mono p-2 flex flex-col justify-between relative shadow-inner select-text transition-all duration-300 overflow-hidden"
                  style={{
                    boxShadow: 'inset 0 3px 8px rgba(0,0,0,0.45)',
                    filter: powerActive ? 'brightness(1)' : 'brightness(0.08)'
                  }}
                >
                  <FormulaLcd
                    ref={formulaLcdRef}
                    expression={expr}
                    result={resultVal}
                    resultDocument={resultDocument}
                    powerActive={powerActive}
                    shiftActive={shiftActive}
                    alphaActive={alphaActive}
                    angleMode={angleMode}
                    calcMode={calcMode}
                    activeMenu={activeMenu}
                    menuIndex={menuScrollIdx}
                    menuItems={MENU_MODES.map(mode => ({ mode, label: MODE_LABELS[mode] }))}
                    variables={variables}
                    listTitle={activeMenu === 'CATALOG' ? catalogView.title : undefined}
                    listItems={activeMenu === 'CATALOG' ? catalogView.items.slice(catalogPageStart, catalogPageStart + 4).map((item, index) => `${index + 1} ${item}`) : undefined}
                    listSelectedIndex={activeMenu === 'CATALOG' ? catalogIndex - catalogPageStart : undefined}
                    modeScreen={runtimeScreenView(modeRuntime)}
                    onExpressionChange={setExpr}
                    onMenuSelect={index => {
                      if (activeMenu === 'MAIN') confirmMenuMode(index);
                      else if (activeMenu === 'CATALOG') selectCatalogItem(catalogPageStart + index);
                      else handleKeypress('append', String(index + 1));
                    }}
                    onModeScreenSelect={index => {
                      if (modeRuntime.screen.kind === 'menu') {
                        const start = Math.floor(modeRuntime.screen.selected / 5) * 5;
                        const option = modeRuntime.screen.options[start + index];
                        if (option) applyModeAction({ type: 'append', value: option.key });
                      }
                    }}
                  />

                  {/* Subtle pixel line horizontal alignment overlays */}
                  <div className="absolute inset-0 bg-repeat bg-[linear-gradient(rgba(0,0,0,0.045)_1px,_transparent_1.5px)] bg-[size:100%_4px] pointer-events-none z-[4]" />
                  <div className="absolute inset-0 bg-repeat bg-[linear-gradient(90deg,_rgba(0,0,0,0.03)_1px,_transparent_1.5px)] bg-[size:3px_100%] pointer-events-none z-[4]" />

                  {/* LCD Screen On Glass shine overlay */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none transform -skew-x-12 scale-125 z-[5]" />


                  {/* FormulaLcd owns all screen pixels; overlays above are glass/scanline only. */}
                </div>
              </div>
            </div>

            {/* KEYPAD AREA GRID */}
            <div className="flex flex-col gap-1.5 z-[3] px-0.5 mt-0.5 select-none">
              
              {/* Upper keypad block containing Shift, Alpha, D-Pad, Menu, On AND Optn, Calc, ∫dx, x */}
              <div className="grid grid-cols-12 gap-x-1.5 gap-y-1 items-start">
                
                {/* --- ROW 1 LEFT --- */}
                {/* SHIFT */}
                <div className="col-span-2 relative flex flex-col items-center pt-3">
                  <span className="text-[#c2ae51] text-[8px] font-black tracking-tight leading-none absolute top-0 left-1/2 -translate-x-1/2 select-none whitespace-nowrap">
                    SHIFT
                  </span>
                  <button 
                    onClick={() => handleKeypress('shift')}
                    className={`w-full h-6 rounded-md border border-[#171a21] shadow-[0_3px_0_#0a0d13] active:translate-y-0.5 active:shadow-[0_1px_0_#0a0d13] flex items-center justify-center transition-transform cursor-pointer overflow-hidden ${shiftActive ? 'bg-[#c2ae51] text-stone-900' : 'bg-gradient-to-b from-stone-400 to-stone-600 text-stone-100'}`}
                  >
                    <div className="w-full h-full bg-white/10 flex items-center justify-center font-sans tracking-tighter text-[9px] font-extrabold">
                      SFT
                    </div>
                  </button>
                </div>

                {/* ALPHA */}
                <div className="col-span-2 relative flex flex-col items-center pt-3">
                  <span className="text-[#d9658d] text-[8px] font-black tracking-tight leading-none absolute top-0 left-1/2 -translate-x-1/2 select-none whitespace-nowrap">
                    ALPHA
                  </span>
                  <button 
                    onClick={() => handleKeypress('alpha')}
                    className={`w-full h-6 rounded-md border border-[#171a21] shadow-[0_3px_0_#0a0d13] active:translate-y-0.5 active:shadow-[0_1px_0_#0a0d13] flex items-center justify-center transition-transform cursor-pointer overflow-hidden ${alphaActive ? 'bg-[#d9658d] text-stone-900' : 'bg-gradient-to-b from-stone-400 to-stone-600 text-stone-100'}`}
                  >
                    <div className="w-full h-full bg-white/10 flex items-center justify-center font-sans tracking-tighter text-[9px] font-extrabold">
                      ALP
                    </div>
                  </button>
                </div>

                {/* --- CENTER D-PAD (SPANS 2 ROWS) --- */}
                <div className="col-span-4 row-span-2 flex justify-center items-center h-full pt-1">
                  <div className="relative w-[92px] h-[92px] rounded-full bg-gradient-to-b from-[#4d5766] via-[#21262d] to-[#0d1014] border-2 border-[#12161b] shadow-lg flex items-center justify-center">
                    
                    {/* Inner compass overlay and arrows */}
                    <button 
                      onClick={() => handleKeypress('arrow_left')}
                      className="absolute left-1 w-6 h-7 text-stone-400 hover:text-white transition-colors flex items-center justify-center text-xs font-bold active:scale-90"
                      title="左"
                    >
                      ◀
                    </button>
                    <button 
                      onClick={() => handleKeypress('arrow_right')}
                      className="absolute right-1 w-6 h-7 text-stone-400 hover:text-white transition-colors flex items-center justify-center text-xs font-bold active:scale-90"
                      title="右"
                    >
                      ▶
                    </button>
                    <button 
                      onClick={() => handleKeypress('arrow_up')}
                      className="absolute top-1 w-7 h-6 text-stone-400 hover:text-white transition-colors flex items-center justify-center text-xs font-bold active:scale-90"
                      title="上"
                    >
                      ▲
                    </button>
                    <button 
                      onClick={() => handleKeypress('arrow_down')}
                      className="absolute bottom-1 w-7 h-6 text-stone-400 hover:text-white transition-colors flex items-center justify-center text-xs font-bold active:scale-90"
                      title="下"
                    >
                      ▼
                    </button>

                    {/* D-pad cap inner round metal plate */}
                    <div className="w-10 h-10 rounded-full bg-[#181a20] border border-[#2e3440] shadow-inner flex items-center justify-center" />
                  </div>
                </div>

                {/* --- ROW 1 RIGHT --- */}
                {/* SETUP MENU */}
                <div className="col-span-2 relative flex flex-col items-center pt-3">
                  <span className="text-[7.5px] font-black tracking-tight leading-none absolute top-0 left-1/2 -translate-x-1/2 select-none text-center whitespace-nowrap">
                    <span className="text-white mr-0.5">菜单</span>
                    <span className="text-[#c2ae51]">设置</span>
                  </span>
                  <button 
                    onClick={() => handleKeypress('menu', 'MENU', 'SETUP')}
                    className="w-full h-6 rounded-md bg-stone-800 text-[#eee4d1] border border-[#171a21] shadow-[0_3px_0_#0a0d13] active:translate-y-0.5 active:shadow-[0_1px_0_#0a0d13] flex items-center justify-center transition-transform cursor-pointer overflow-hidden"
                  >
                    <div className="w-full h-full bg-white/5 flex items-center justify-center font-sans tracking-tighter text-[8px] font-extrabold">
                      菜单
                    </div>
                  </button>
                </div>

                {/* ON */}
                <div className="col-span-2 relative flex flex-col items-center pt-3">
                  <span className="text-white text-[8px] font-black tracking-tight leading-none absolute top-0 left-1/2 -translate-x-1/2 select-none whitespace-nowrap text-center">
                    开机
                  </span>
                  <button 
                    onClick={() => handleKeypress('on')}
                    className="w-full h-6 rounded-md bg-stone-800 text-stone-100 border border-[#171a21] shadow-[0_3px_0_#0a0d13] active:translate-y-0.5 active:shadow-[0_1px_0_#0a0d13] flex items-center justify-center transition-transform cursor-pointer overflow-hidden"
                  >
                    <div className="w-full h-full bg-white/5 flex items-center justify-center font-sans tracking-tighter text-[8px] font-extrabold">
                      ON
                    </div>
                  </button>
                </div>

                {/* --- ROW 2 LEFT (aligns automatically in grid layout) --- */}
                {/* OPTN */}
                <div className="col-span-2 relative flex flex-col pt-3">
                  <button 
                    onClick={() => handleKeypress('optn')}
                    className="w-full h-7 rounded-md bg-[#2d323f]/95 text-stone-100 border border-[#111317] shadow-[0_3.5px_0_#06080b] active:translate-y-0.5 active:shadow-[0_1px_0_#06080b] flex items-center justify-center transition-transform font-bold text-[9px]"
                  >
                    OPTN
                  </button>
                </div>

                {/* CALC */}
                <div className="col-span-2 relative flex flex-col pt-3">
                  <span className="text-[#c2ae51] text-[7.5px] font-black absolute top-0 left-1.5 whitespace-nowrap">SOLVE</span>
                  <span className="text-[#d9658d] text-[7.5px] font-black absolute top-0 right-1.5">=</span>
                  <button 
                    onClick={() => handleKeypress('calc', 'CALC', 'SOLVE', '=')}
                    className="w-full h-7 rounded-md bg-[#2d323f]/95 text-stone-100 border border-[#111317] shadow-[0_3.5px_0_#06080b] active:translate-y-0.5 active:shadow-[0_1px_0_#06080b] flex items-center justify-center transition-transform font-bold text-[9px]"
                  >
                    CALC
                  </button>
                </div>

                {/* [D-Pad row-span automatically occupies columns 5-8 of Row 2] */}

                {/* --- ROW 2 RIGHT --- */}
                {/* ∫dx */}
                <div className="col-span-2 relative flex flex-col pt-3">
                  <span className="text-[#c2ae51] text-[7.5px] font-black absolute top-0 left-1.5 whitespace-nowrap">d/dx</span>
                  <span className="text-[#d9658d] text-[7.5px] font-black absolute top-0 right-2">:</span>
                  <button 
                    onClick={() => handleKeypress('append', '∫dx', 'd/dx', ':')}
                    className="w-full h-7 rounded-md bg-[#2d323f]/95 text-stone-100 border border-[#111317] shadow-[0_3.5px_0_#06080b] active:translate-y-0.5 active:shadow-[0_1px_0_#06080b] flex items-center justify-center transition-transform font-bold text-[9px]"
                  >
                    ∫dx
                  </button>
                </div>

                {/* x (variable) */}
                <div className="col-span-2 relative flex flex-col pt-3">
                  <span className="text-[#c2ae51] text-[7.5px] font-black absolute top-0 left-2.5">Σ</span>
                  <button 
                    onClick={() => handleKeypress('append', 'X', 'Σ')}
                    className="w-full h-7 rounded-md bg-[#2d323f]/95 text-stone-100 border border-[#111317] shadow-[0_3.5px_0_#06080b] active:translate-y-0.5 active:shadow-[0_1px_0_#06080b] flex items-center justify-center transition-transform font-bold text-[9px]"
                  >
                    X
                  </button>
                </div>

              </div>

              {/* Rows 3-5: Dark Mathematical Functions grid (6 columns) */}
              <div className="grid grid-cols-6 gap-x-1.5 gap-y-2.5 pt-2 pb-1">
                
                {/* --- Row 3 of Keypad --- */}
                {/* Fraction Box */}
                <div className="relative flex flex-col pt-2 pb-1">
                  <span className="text-[#c2ae51] text-[7.5px] font-black absolute top-0.5 left-0 scale-90 origin-left whitespace-nowrap">■ ▭/▭</span>
                  <span className="text-[#d9658d] text-[7.5px] font-black absolute top-0.5 right-0 scale-90 origin-right">÷R</span>
                  <button 
                    onClick={() => handleKeypress('append', '/', '■ ▭/▭', '÷R')}
                    className="h-7 rounded bg-[#2a2f3a] text-stone-100 border border-[#151a22] shadow-[0_3.5px_0_#05070a] active:translate-y-0.5 active:shadow-[0_1px_0_#05070a] flex items-center justify-center text-xs font-bold"
                  >
                    ■/□
                  </button>
                </div>

                {/* √■ */}
                <div className="relative flex flex-col pt-2 pb-1">
                  <span className="text-[#c2ae51] text-[7.5px] font-black absolute top-0.5 left-0 scale-95 origin-left">³√■</span>
                  <button 
                    onClick={() => handleKeypress('append', '√(', '³√(')}
                    className="h-7 rounded bg-[#2a2f3a] text-stone-100 border border-[#151a22] shadow-[0_3.5px_0_#05070a] active:translate-y-0.5 active:shadow-[0_1px_0_#05070a] flex items-center justify-center text-xs font-bold"
                  >
                    √■
                  </button>
                </div>

                {/* x² */}
                <div className="relative flex flex-col pt-2 pb-1">
                  <span className="text-[#c2ae51] text-[7.5px] font-black absolute top-0.5 left-0">x³</span>
                  <span className="text-[#2ca9cf] text-[6.5px] font-extrabold absolute top-0.5 right-0">DEC</span>
                  <button 
                    onClick={() => handleKeypress('append', '²', '³')}
                    className="h-7 rounded bg-[#2a2f3a] text-stone-100 border border-[#151a22] shadow-[0_3.5px_0_#05070a] active:translate-y-0.5 active:shadow-[0_1px_0_#05070a] flex items-center justify-center text-xs font-bold"
                  >
                    x²
                  </button>
                </div>

                {/* x^■ */}
                <div className="relative flex flex-col pt-2 pb-1">
                  <span className="text-[#c2ae51] text-[7.5px] font-black absolute top-0.5 left-0">■√■</span>
                  <span className="text-[#2ca9cf] text-[6.5px] font-extrabold absolute top-0.5 right-0">HEX</span>
                  <button 
                    onClick={() => handleKeypress('append', '^(', '■√■')}
                    className="h-7 rounded bg-[#2a2f3a] text-stone-100 border border-[#151a22] shadow-[0_3.5px_0_#05070a] active:translate-y-0.5 active:shadow-[0_1px_0_#05070a] flex items-center justify-center text-xs font-bold"
                  >
                    x■
                  </button>
                </div>

                {/* log_■ ■ */}
                <div className="relative flex flex-col pt-2 pb-1">
                  <span className="text-[#c2ae51] text-[7.5px] font-black absolute top-0.5 left-0">10^■</span>
                  <span className="text-[#2ca9cf] text-[6.5px] font-extrabold absolute top-0.5 right-0">BIN</span>
                  <button 
                    onClick={() => handleKeypress('append', 'log□(', '10^')}
                    className="h-7 rounded bg-[#2a2f3a] text-[9.5px] font-bold text-stone-100 border border-[#151a22] shadow-[0_3.5px_0_#05070a] active:translate-y-0.5 active:shadow-[0_1px_0_#05070a] flex items-center justify-center"
                  >
                    log
                  </button>
                </div>

                {/* In (natural log) */}
                <div className="relative flex flex-col pt-2 pb-1">
                  <span className="text-[#c2ae51] text-[7.5px] font-black absolute top-0.5 left-0">e^■</span>
                  <span className="text-[#2ca9cf] text-[6.5px] font-extrabold absolute top-0.5 right-0">OCT</span>
                  <button 
                    onClick={() => handleKeypress('append', 'ln(', 'e^')}
                    className="h-7 rounded bg-[#2a2f3a] text-stone-100 border border-[#151a22] shadow-[0_3.5px_0_#05070a] active:translate-y-0.5 active:shadow-[0_1px_0_#05070a] flex items-center justify-center text-xs font-bold"
                  >
                    In
                  </button>
                </div>

                {/* --- Row 4 of Keypad --- */}
                {/* (-) */}
                <div className="relative flex flex-col pt-2 pb-1">
                  <span className="text-[#c2ae51] text-[7.5px] font-black absolute top-0.5 left-0">log</span>
                  <span className="text-[#d9658d] text-[7.5px] font-black absolute top-0.5 right-0">A</span>
                  <button 
                    onClick={() => handleKeypress('append', '-', 'log(', 'A')}
                    className="h-7 rounded bg-[#2a2f3a] text-stone-100 border border-[#151a22] shadow-[0_3.5px_0_#05070a] active:translate-y-0.5 active:shadow-[0_1px_0_#05070a] flex items-center justify-center text-xs"
                  >
                    (-)
                  </button>
                </div>

                {/* ° ' " */}
                <div className="relative flex flex-col pt-2 pb-1">
                  <span className="text-[#c2ae51] text-[7.5px] font-black absolute top-0.5 left-0">FACT</span>
                  <span className="text-[#d9658d] text-[7.5px] font-black absolute top-0.5 right-0">B</span>
                  <button 
                    onClick={() => handleKeypress('append', '°', 'FACT', 'B')}
                    className="h-7 rounded bg-[#2a2f3a] text-stone-100 border border-[#151a22] shadow-[0_3.5px_0_#05070a] active:translate-y-0.5 active:shadow-[0_1px_0_#05070a] flex items-center justify-center text-xs"
                    title="度分秒"
                  >
                    °′″
                  </button>
                </div>

                {/* x⁻¹ */}
                <div className="relative flex flex-col pt-2 pb-1">
                  <span className="text-[#c2ae51] text-[7.5px] font-black absolute top-0.5 left-0">x!</span>
                  <span className="text-[#d9658d] text-[7.5px] font-black absolute top-0.5 right-0">C</span>
                  <button 
                    onClick={() => handleKeypress('append', '⁻¹', '!', 'C')}
                    className="h-7 rounded bg-[#2a2f3a] text-[10px] text-stone-100 border border-[#151a22] shadow-[0_3.5px_0_#05070a] active:translate-y-0.5 active:shadow-[0_1px_0_#05070a] flex items-center justify-center"
                  >
                    x⁻¹
                  </button>
                </div>

                {/* sin */}
                <div className="relative flex flex-col pt-2 pb-1">
                  <span className="text-[#c2ae51] text-[7.5px] font-black absolute top-0.5 left-0">sin⁻¹</span>
                  <span className="text-[#d9658d] text-[7.5px] font-black absolute top-0.5 right-0">D</span>
                  <button 
                    onClick={() => handleKeypress('append', 'sin(', 'sin⁻¹(', 'D')}
                    className="h-7 rounded bg-[#2a2f3a] text-stone-100 border border-[#151a22] shadow-[0_3.5px_0_#05070a] active:translate-y-0.5 active:shadow-[0_1px_0_#05070a] flex items-center justify-center text-[11px]"
                  >
                    sin
                  </button>
                </div>

                {/* cos */}
                <div className="relative flex flex-col pt-2 pb-1">
                  <span className="text-[#c2ae51] text-[7.5px] font-black absolute top-0.5 left-0">cos⁻¹</span>
                  <span className="text-[#d9658d] text-[7.5px] font-black absolute top-0.5 right-0">E</span>
                  <button 
                    onClick={() => handleKeypress('append', 'cos(', 'cos⁻¹(', 'E')}
                    className="h-7 rounded bg-[#2a2f3a] text-stone-100 border border-[#151a22] shadow-[0_3.5px_0_#05070a] active:translate-y-0.5 active:shadow-[0_1px_0_#05070a] flex items-center justify-center text-[11px]"
                  >
                    cos
                  </button>
                </div>

                {/* tan */}
                <div className="relative flex flex-col pt-2 pb-1">
                  <span className="text-[#c2ae51] text-[7.5px] font-black absolute top-0.5 left-0">tan⁻¹</span>
                  <span className="text-[#d9658d] text-[7.5px] font-black absolute top-0.5 right-0">F</span>
                  <button 
                    onClick={() => handleKeypress('append', 'tan(', 'tan⁻¹(', 'F')}
                    className="h-7 rounded bg-[#2a2f3a] text-stone-100 border border-[#151a22] shadow-[0_3.5px_0_#05070a] active:translate-y-0.5 active:shadow-[0_1px_0_#05070a] flex items-center justify-center text-[11px]"
                  >
                    tan
                  </button>
                </div>

                {/* --- Row 5 of Keypad --- */}
                {/* STO */}
                <div className="relative flex flex-col pt-2 pb-1">
                  <span className="text-[#c2ae51] text-[7.5px] font-black absolute top-0.5 left-0">调用</span>
                  <button 
                    onClick={() => handleKeypress('store_mode', 'STORE', 'RECALL')}
                    className="h-7 rounded bg-[#2a2f3a] text-[#eee] border border-[#151a22] shadow-[0_3.5px_0_#05070a] active:translate-y-0.5 active:shadow-[0_1px_0_#05070a] flex items-center justify-center text-[10px] font-bold"
                  >
                    STO
                  </button>
                </div>

                {/* ENG */}
                <div className="relative flex flex-col pt-2 pb-1">
                  <span className="text-[#2ca9cf] text-[7.5px] font-black absolute top-0.5 left-0.5">∠</span>
                  <span className="text-[#c2ae51] text-[7.5px] font-black absolute top-0.5 left-1/2 -translate-x-1/2">←</span>
                  <span className="text-[#d9658d] text-[7.5px] font-black absolute top-0.5 right-0.5">i</span>
                  <button 
                    onClick={() => handleKeypress('eng', 'ENG', '←', 'i')}
                    className="h-7 rounded bg-[#2a2f3a] text-stone-100 border border-[#151a22] shadow-[0_3.5px_0_#05070a] active:translate-y-0.5 active:shadow-[0_1px_0_#05070a] flex items-center justify-center text-[10px] font-bold"
                  >
                    ENG
                  </button>
                </div>

                {/* ( */}
                <div className="relative flex flex-col pt-2 pb-1">
                  <span className="text-[#c2ae51] text-[7.5px] font-black absolute top-0.5 left-0">Abs</span>
                  <button 
                    onClick={() => handleKeypress('append', '(', 'Abs(')}
                    className="h-7 rounded bg-[#2a2f3a] text-[#eee] border border-[#151a22] shadow-[0_3.5px_0_#05070a] active:translate-y-0.5 active:shadow-[0_1px_0_#05070a] flex items-center justify-center text-xs"
                  >
                    (
                  </button>
                </div>

                {/* ) */}
                <div className="relative flex flex-col pt-2 pb-1">
                  <span className="text-[#c2ae51] text-[7.5px] font-black absolute top-0.5 left-0">,</span>
                  <span className="text-[#d9658d] text-[7.5px] font-black absolute top-0.5 right-0">X</span>
                  <button 
                    onClick={() => handleKeypress('append', ')', ',', 'X')}
                    className="h-7 rounded bg-[#2a2f3a] text-[#eee] border border-[#151a22] shadow-[0_3.5px_0_#05070a] active:translate-y-0.5 active:shadow-[0_1px_0_#05070a] flex items-center justify-center text-xs"
                  >
                    )
                  </button>
                </div>

                {/* S-D */}
                <div className="relative flex flex-col pt-2 pb-1">
                  <span className="text-[#c2ae51] text-[7.5px] font-black absolute top-0.5 left-0 scale-90 origin-left whitespace-nowrap">a b/c⇔d/c</span>
                  <span className="text-[#d9658d] text-[7.5px] font-black absolute top-0.5 right-0">Y</span>
                  <button 
                    onClick={() => handleKeypress('sd', 'S⇔D', undefined, 'Y')}
                    className="h-7 rounded bg-[#2a2f3a] text-stone-100 border border-[#151a22] shadow-[0_3.5px_0_#05070a] active:translate-y-0.5 active:shadow-[0_1px_0_#05070a] flex items-center justify-center text-[10px] font-bold"
                  >
                    S⇔D
                  </button>
                </div>

                {/* M+ */}
                <div className="relative flex flex-col pt-2 pb-1">
                  <span className="text-[#c2ae51] text-[7.5px] font-black absolute top-0.5 left-0">M-</span>
                  <span className="text-[#d9658d] text-[7.5px] font-black absolute top-0.5 right-0">M</span>
                  <button 
                    onClick={() => handleKeypress('mplus', 'M+', 'M-', 'M')}
                    className="h-7 rounded bg-[#2a2f3a] text-stone-100 border border-[#151a22] shadow-[0_3.5px_0_#05070a] active:translate-y-0.5 active:shadow-[0_1px_0_#05070a] flex items-center justify-center text-[10px] font-bold"
                  >
                    M+
                  </button>
                </div>

              </div>

              {/* Rows 6-9: Numeric Keys and Basic Operators (White keys, plus DEL/AC in Blue) */}
              <div className="grid grid-cols-5 gap-y-2.5 gap-x-2 pt-2">
                
                {/* --- Row 6 of Keypad --- */}
                {/* 7 */}
                <div className="relative flex flex-col pt-2">
                  <span className="text-[#c2ae51] text-[7.5px] font-black absolute top-0 left-1 select-none">科学常数</span>
                  <button 
                    onClick={() => handleKeypress('append', '7', 'CONST_MENU')}
                    className="h-10 rounded-lg bg-gradient-to-b from-[#f9f8f4] to-[#dedaca] text-stone-900 border-2 border-stone-950/80 shadow-[0_4px_0_#181a20] active:translate-y-0.5 active:shadow-[0_1.5px_0_#181a20] flex items-center justify-center text-lg font-black transition-transform"
                  >
                    7
                  </button>
                </div>

                {/* 8 */}
                <div className="relative flex flex-col pt-2">
                  <span className="text-[#c2ae51] text-[7.5px] font-black absolute top-0 left-1 select-none">单位换算</span>
                  <button 
                    onClick={() => handleKeypress('append', '8', 'CONV_MENU')}
                    className="h-10 rounded-lg bg-gradient-to-b from-[#f9f8f4] to-[#dedaca] text-stone-900 border-2 border-stone-950/80 shadow-[0_4px_0_#181a20] active:translate-y-0.5 active:shadow-[0_1.5px_0_#181a20] flex items-center justify-center text-lg font-black transition-transform"
                  >
                    8
                  </button>
                </div>

                {/* 9 */}
                <div className="relative flex flex-col pt-2">
                  <span className="text-[#c2ae51] text-[7.5px] font-black absolute top-0 left-2 select-none">复位</span>
                  <button 
                    onClick={() => handleKeypress('append', '9', 'RESET')}
                    className="h-10 rounded-lg bg-gradient-to-b from-[#f9f8f4] to-[#dedaca] text-stone-900 border-2 border-stone-950/80 shadow-[0_4px_0_#181a20] active:translate-y-0.5 active:shadow-[0_1.5px_0_#181a20] flex items-center justify-center text-lg font-black transition-transform"
                  >
                    9
                  </button>
                </div>

                {/* DEL (Blue delete) */}
                <div className="relative flex flex-col pt-2">
                  <span className="text-[#c2ae51] text-[7.5px] font-black absolute top-0 left-1 select-none">插入</span>
                  <span className="text-[#d9658d] text-[7.5px] font-black absolute top-0 right-1 select-none">撤消</span>
                  <button 
                    onClick={() => handleKeypress('backspace')}
                    className="h-10 rounded-lg bg-gradient-to-b from-[#2576df] to-[#124baa] text-white border-2 border-[#10377e] shadow-[0_4px_0_#071b40] active:translate-y-0.5 active:shadow-[0_1.5px_0_#071b40] flex items-center justify-center text-sm font-black transition-transform whitespace-nowrap"
                  >
                    DEL
                  </button>
                </div>

                {/* AC (Blue Clear All) */}
                <div className="relative flex flex-col pt-2">
                  <span className="text-[#c2ae51] text-[7.5px] font-black absolute top-0 left-1 select-none">关机</span>
                  <button 
                    onClick={() => handleKeypress('clear', '', 'OFF')}
                    className="h-10 rounded-lg bg-gradient-to-b from-[#2576df] to-[#124baa] text-white border-2 border-[#10377e] shadow-[0_4px_0_#071b40] active:translate-y-0.5 active:shadow-[0_1.5px_0_#071b40] flex items-center justify-center text-sm font-black transition-transform whitespace-nowrap"
                  >
                    AC
                  </button>
                </div>


                {/* --- Row 7 of Keypad --- */}
                {/* 4 */}
                <div className="relative flex flex-col pt-2">
                  <button 
                    onClick={() => handleKeypress('append', '4')}
                    className="h-10 rounded-lg bg-gradient-to-b from-[#f9f8f4] to-[#dedaca] text-stone-900 border-2 border-stone-950/80 shadow-[0_4px_0_#181a20] active:translate-y-0.5 active:shadow-[0_1.5px_0_#181a20] flex items-center justify-center text-lg font-black w-full"
                  >
                    4
                  </button>
                </div>

                {/* 5 */}
                <div className="relative flex flex-col pt-2">
                  <button 
                    onClick={() => handleKeypress('append', '5')}
                    className="h-10 rounded-lg bg-gradient-to-b from-[#f9f8f4] to-[#dedaca] text-stone-900 border-2 border-stone-950/80 shadow-[0_4px_0_#181a20] active:translate-y-0.5 active:shadow-[0_1.5px_0_#181a20] flex items-center justify-center text-lg font-black w-full"
                  >
                    5
                  </button>
                </div>

                {/* 6 */}
                <div className="relative flex flex-col pt-2">
                  <button 
                    onClick={() => handleKeypress('append', '6')}
                    className="h-10 rounded-lg bg-gradient-to-b from-[#f9f8f4] to-[#dedaca] text-stone-900 border-2 border-stone-950/80 shadow-[0_4px_0_#181a20] active:translate-y-0.5 active:shadow-[0_1.5px_0_#181a20] flex items-center justify-center text-lg font-black w-full"
                  >
                    6
                  </button>
                </div>

                {/* × Multiplication */}
                <div className="relative flex flex-col pt-2">
                  <span className="text-[#c2ae51] text-[7.5px] font-black absolute top-0 left-1 select-none">nPr</span>
                  <button 
                    onClick={() => handleKeypress('append', '×', ' P ')}
                    className="h-10 rounded-lg bg-gradient-to-b from-[#eaebee] to-[#b6c0cd] text-stone-900 border-2 border-stone-950/80 shadow-[0_4px_0_#181a20] active:translate-y-0.5 active:shadow-[0_1.5px_0_#181a20] flex items-center justify-center text-lg font-bold"
                  >
                    ×
                  </button>
                </div>

                {/* ÷ Division */}
                <div className="relative flex flex-col pt-2">
                  <span className="text-[#c2ae51] text-[7.5px] font-black absolute top-0 left-1 select-none">nCr</span>
                  <button 
                    onClick={() => handleKeypress('append', '÷', ' C ')}
                    className="h-10 rounded-lg bg-gradient-to-b from-[#eaebee] to-[#b6c0cd] text-stone-900 border-2 border-stone-950/80 shadow-[0_4px_0_#181a20] active:translate-y-0.5 active:shadow-[0_1.5px_0_#181a20] flex items-center justify-center text-lg font-bold"
                  >
                    ÷
                  </button>
                </div>


                {/* --- Row 8 of Keypad --- */}
                {/* 1 */}
                <div className="relative flex flex-col pt-2">
                  <button 
                    onClick={() => handleKeypress('append', '1')}
                    className="h-10 rounded-lg bg-gradient-to-b from-[#f9f8f4] to-[#dedaca] text-stone-900 border-2 border-stone-950/80 shadow-[0_4px_0_#181a20] active:translate-y-0.5 active:shadow-[0_1.5px_0_#181a20] flex items-center justify-center text-lg font-black w-full"
                  >
                    1
                  </button>
                </div>

                {/* 2 */}
                <div className="relative flex flex-col pt-2">
                  <button 
                    onClick={() => handleKeypress('append', '2')}
                    className="h-10 rounded-lg bg-gradient-to-b from-[#f9f8f4] to-[#dedaca] text-stone-900 border-2 border-stone-950/80 shadow-[0_4px_0_#181a20] active:translate-y-0.5 active:shadow-[0_1.5px_0_#181a20] flex items-center justify-center text-lg font-black w-full"
                  >
                    2
                  </button>
                </div>

                {/* 3 */}
                <div className="relative flex flex-col pt-2">
                  <button 
                    onClick={() => handleKeypress('append', '3')}
                    className="h-10 rounded-lg bg-gradient-to-b from-[#f9f8f4] to-[#dedaca] text-stone-900 border-2 border-stone-950/80 shadow-[0_4px_0_#181a20] active:translate-y-0.5 active:shadow-[0_1.5px_0_#181a20] flex items-center justify-center text-lg font-black w-full"
                  >
                    3
                  </button>
                </div>

                {/* + Addition */}
                <div className="relative flex flex-col pt-2">
                  <span className="text-[#c2ae51] text-[7.5px] font-black absolute top-0 left-1 select-none">Pol</span>
                  <button 
                    onClick={() => handleKeypress('append', '+', 'Pol(')}
                    className="h-10 rounded-lg bg-gradient-to-b from-[#eaebee] to-[#b6c0cd] text-stone-900 border-2 border-stone-950/80 shadow-[0_4px_0_#181a20] active:translate-y-0.5 active:shadow-[0_1.5px_0_#181a20] flex items-center justify-center text-lg font-bold"
                  >
                    +
                  </button>
                </div>

                {/* − Subtraction */}
                <div className="relative flex flex-col pt-2">
                  <span className="text-[#c2ae51] text-[7.5px] font-black absolute top-0 left-1 select-none">Rec</span>
                  <button 
                    onClick={() => handleKeypress('append', '-', 'Rec(')}
                    className="h-10 rounded-lg bg-gradient-to-b from-[#eaebee] to-[#b6c0cd] text-stone-900 border-2 border-stone-950/80 shadow-[0_4px_0_#181a20] active:translate-y-0.5 active:shadow-[0_1.5px_0_#181a20] flex items-center justify-center text-lg font-bold"
                  >
                    −
                  </button>
                </div>


                {/* --- Row 9 of Keypad --- */}
                {/* 0 */}
                <div className="relative flex flex-col pt-2">
                  <span className="text-[#c2ae51] text-[7.5px] font-black absolute top-0 left-2 select-none">Rnd</span>
                  <button 
                    onClick={() => handleKeypress('append', '0', 'Rnd(')}
                    className="h-10 rounded-lg bg-gradient-to-b from-[#f9f8f4] to-[#dedaca] text-stone-900 border-2 border-stone-950/80 shadow-[0_4px_0_#181a20] active:translate-y-0.5 active:shadow-[0_1.5px_0_#181a20] flex items-center justify-center text-lg font-black transition-transform"
                  >
                    0
                  </button>
                </div>

                {/* . Decimal Point */}
                <div className="relative flex flex-col pt-2">
                  <span className="text-[#c2ae51] text-[7.5px] font-black absolute top-0 left-0 scale-95 origin-left select-none">Ran#</span>
                  <span className="text-[#d9658d] text-[7.5px] font-black absolute top-0 right-0 scale-95 origin-right select-none">RanInt</span>
                  <button 
                    onClick={() => handleKeypress('append', '.', 'Ran#', 'RanInt(')}
                    className="h-10 rounded-lg bg-gradient-to-b from-[#f9f8f4] to-[#dedaca] text-stone-900 border-2 border-stone-950/80 shadow-[0_4px_0_#181a20] active:translate-y-0.5 active:shadow-[0_1.5px_0_#181a20] flex items-center justify-center text-lg font-extrabold transition-transform"
                  >
                    ·
                  </button>
                </div>

                {/* x10^x */}
                <div className="relative flex flex-col pt-2">
                  <span className="text-[#c2ae51] text-[7.5px] font-black absolute top-0 left-2 select-none">π</span>
                  <span className="text-[#d9658d] text-[7.5px] font-black absolute top-0 right-2 select-none">e</span>
                  <button 
                    onClick={() => handleKeypress('append', 'E', 'π', 'e')} // scientific E or natural e via ALPHA
                    className="h-10 rounded-lg bg-gradient-to-b from-[#f9f8f4] to-[#dedaca] text-stone-900 border-2 border-stone-950/80 shadow-[0_4px_0_#181a20] active:translate-y-0.5 active:shadow-[0_1.5px_0_#181a20] flex items-center justify-center text-[10px] font-black transition-transform leading-relaxed"
                  >
                    ×10ˣ
                  </button>
                </div>

                {/* Ans previous state */}
                <div className="relative flex flex-col pt-2">
                  <span className="text-[#c2ae51] text-[7.5px] font-black absolute top-0 left-2 select-none">%</span>
                  <button 
                    onClick={() => handleKeypress('append', 'Ans', '%')}
                    className="h-10 rounded-lg bg-gradient-to-b from-[#f9f8f4] to-[#dedaca] text-stone-900 border-2 border-stone-950/80 shadow-[0_4px_0_#181a20] active:translate-y-0.5 active:shadow-[0_1.5px_0_#181a20] flex items-center justify-center text-xs font-black transition-transform"
                  >
                    Ans
                  </button>
                </div>

                {/* = Equal execute */}
                <div className="relative flex flex-col pt-2">
                  <span className="text-[#c2ae51] text-[7.5px] font-black absolute top-0 left-2 select-none">≈</span>
                  <button 
                    onClick={() => handleKeypress('evaluate')}
                    className="h-10 rounded-lg bg-gradient-to-b from-[#eadecb] to-[#998b71] text-stone-900 border-2 border-[#544d3e] shadow-[0_4px_0_#2b271d] active:translate-y-0.5 active:shadow-[0_1.5px_0_#2b271d] flex items-center justify-center text-lg font-black transition-transform"
                  >
                    =
                  </button>
                </div>

              </div>

            </div>

            {/* Bottom branding footer */}
            <div className="text-[7.5px] text-slate-500/80 font-mono tracking-wider font-extrabold text-center select-none pt-1">
              LAR GEO YOS DEVELOPMENTS
            </div>

          </div>
        </div>

        {/* RIGHT COLUMN: HIGH FIDELITY SIDE INSTRUMENTS PANEL (8 cols) */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-6">
          
          {/* Bento-grid Card Dashboard for Real-time variables / Calculations history */}
          <div className="bg-slate-950/85 border border-slate-800 rounded-2xl shadow-xl p-5 flex-1 flex flex-col">
            
            {/* Live Navigation Tabs */}
            <div className="flex border-b border-slate-800 pb-3 gap-2 shrink-0">
              <button 
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'history' ? 'bg-teal-500/10 text-teal-300 border border-teal-500/20' : 'text-slate-400 hover:text-white'}`}
              >
                <History size={16} />
                计算历史
              </button>
              
              <button 
                onClick={() => setActiveTab('variables')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'variables' ? 'bg-teal-500/10 text-teal-300 border border-teal-500/20' : 'text-slate-400 hover:text-white'}`}
              >
                <Database size={16} />
                变量寄存器 Live
              </button>

              <button 
                onClick={() => setActiveTab('manual')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'manual' ? 'bg-teal-500/10 text-teal-300 border border-teal-500/20' : 'text-slate-400 hover:text-white'}`}
                id="manual"
              >
                <Sliders size={16} />
                高阶指令说明
              </button>
            </div>

            {/* Active Content render */}
            <div className="flex-1 overflow-y-auto mt-4 pr-1 min-h-[280px]">
              <AnimatePresence mode="out-in">
                
                {/* 1. History Logs */}
                {activeTab === 'history' && (
                  <motion.div 
                    key="history"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-3"
                  >
                    {historyList.length === 0 ? (
                      <div className="h-40 flex flex-col items-center justify-center text-slate-500 text-sm gap-2">
                        <Coffee size={24} className="animate-bounce" />
                        暂无历史计算记录
                      </div>
                    ) : (
                      historyList.map((item, idx) => (
                        <div 
                          key={idx} 
                          className="bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 rounded-xl p-3 flex justify-between items-center transition-all cursor-pointer group"
                          onClick={() => {
                            if (item.ast) {
                              formulaLcdRef.current?.loadDocument(item.ast);
                            } else {
                              formulaLcdRef.current?.loadExpression(item.expr);
                            }
                            setExpr(item.expr);
                            setCursorIdx(item.expr.length);
                            triggerClickAudio();
                          }}
                        >
                          <div className="flex flex-col gap-1 text-left">
                            <span className="font-mono text-xs text-slate-500 tracking-wider">
                              输入表达式 EXPR
                            </span>
                            <span className="font-mono font-bold text-sm text-slate-200 group-hover:text-teal-400 transition-colors">
                              {item.expr}
                            </span>
                          </div>

                          <div className="flex flex-col items-end gap-1">
                            <span className="font-mono text-[10px] text-slate-500">
                              {item.timestamp}
                            </span>
                            <span className="font-mono font-extrabold text-[#9fb08f] bg-[#1a2b1c] px-3 py-1 rounded border border-[#2d4d31] text-xs">
                              {item.res}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </motion.div>
                )}

                {/* 2. Live Variables Editor */}
                {activeTab === 'variables' && (
                  <motion.div 
                    key="variables"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3"
                  >
                    {Object.entries(variables).map(([name, val]) => (
                      <div key={name} className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col justify-between gap-3 text-left">
                        <div className="flex justify-between items-center bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800/40">
                          <span className="font-extrabold text-teal-400 text-xs">寄存器 {name}</span>
                          <span className="text-[10px] text-slate-500">REALTIME</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <input 
                            type="number"
                            value={val}
                            onChange={(e) => {
                              const parsed = parseFloat(e.target.value) || 0;
                              setVariables(prev => ({ ...prev, [name]: parsed }));
                            }}
                            className="bg-slate-950/90 border border-slate-800/70 rounded px-2 py-1 text-sm font-mono font-bold text-[#9fb08f] w-full focus:outline-none focus:border-teal-500 transition-all"
                          />
                        </div>

                        <div className="flex gap-1">
                          <button 
                            onClick={() => {
                              insertTextAtCursor(name);
                              triggerClickAudio();
                            }}
                            className="flex-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[10px] font-sans py-1 rounded transition-all text-slate-300 hover:text-white"
                          >
                            插入表达式
                          </button>
                          <button 
                            onClick={() => {
                              const numericalVal = Number(resultVal) || 0;
                              setVariables(prev => ({ ...prev, [name]: numericalVal }));
                              triggerClickAudio();
                            }}
                            className="flex-1 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-[10px] py-1 rounded transition-all"
                          >
                            当前结果存入
                          </button>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}

                {/* 3. Advanced Manual */}
                {activeTab === 'manual' && (
                  <motion.div 
                    key="manual"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4 text-left text-sm text-slate-300 leading-relaxed font-sans"
                  >
                    <div className="bg-slate-900 border border-slate-800/60 rounded-xl p-4">
                      <h4 className="text-teal-400 font-bold mb-2 flex items-center gap-1.5">
                        <ChevronRight size={16} /> 
                        双层按键和 Shift / Alpha 切换
                      </h4>
                      <p className="text-xs text-slate-300">
                        每个按键上印有其基础功能（白色字样）。按键上方左侧的 <span className="text-[#c2ae51] font-bold">金色字样</span> 需通过按一次 <b>SHIFT</b> 键，再按该键触发其第二功能。上方右侧的 <span className="text-[#d9658d] font-bold">粉色字样</span> 需通过按一次 <b>ALPHA</b> 键后触发。
                      </p>
                    </div>

                    <div className="bg-slate-900 border border-slate-800/60 rounded-xl p-4">
                      <h4 className="text-teal-400 font-bold mb-2 flex items-center gap-1.5">
                        <ChevronRight size={16} /> 
                        特色高级模拟功能说明
                      </h4>
                      <ul className="list-disc pl-5 text-xs text-slate-300 space-y-2 mt-2">
                        <li>
                          <span className="text-[#c2ae51] font-extrabold">素因数分解 (FACT)：</span> 
                          当计算得出一个自然数结果并显示在屏幕底端时。可以点击 <b>SHIFT</b> 然后按 <b>°′″ (FACT)</b> 键，计算器会自动对该自然数进行素因数底幂乘积式分解（例：36 分解为 2² × 3²）！
                        </li>
                        <li>
                          <span className="text-[#d9658d] font-extrabold">有余数除法 (÷R)：</span> 
                          可以使用 <b>■/□</b> 上方的有余数除法功能。在表达式里写下 <code>9÷R4</code>，点击等于号，屏幕会精确显示 <code>Q=2, R=1</code> 也就是商2余1。
                        </li>
                        <li>
                          <span className="text-[#c2ae51] font-extrabold">科学常量库 (SCI CONST)：</span> 
                          点击 <b>SHIFT</b> 再点击带有金色 <code>科学常数</code> 标识的 <b>7</b> 键，LCD将显示科学常数名录（包括光速 c、普朗克 h 等 6 种标准物理常数），按下对应数字即可载入物理常数值！
                        </li>
                        <li>
                          <span className="text-[#c2ae51] font-extrabold">单位换算 (UNIT CONV)：</span> 
                          点击 <b>SHIFT</b> 后再点击 <b>8 (单位换算)</b> 键，可以使用内置换算程序，计算厘米与英寸、公斤与磅之间的换算比例。
                        </li>
                        <li>
                          <span className="text-[#c2ae51] font-extrabold">总线复位 (RESET)：</span> 
                          点击 <b>SHIFT</b> 后再点击 <b>9 (复位)</b> 键，即可清除整机内存变量，或将设置恢复出厂模式。
                        </li>
                      </ul>
                    </div>

                    <div className="bg-slate-900 border border-slate-800/60 rounded-xl p-4">
                      <h4 className="text-teal-400 font-bold mb-2 flex items-center gap-1.5">
                        <ChevronRight size={16} />
                        fx-991CNCW / fx-999CNCW 核心能力
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-[11px] text-slate-300">
                        {APP_CAPABILITIES.map(item => (
                          <span key={item} className="rounded border border-slate-800 bg-slate-950/70 px-2 py-1 font-mono">
                            {item}
                          </span>
                        ))}
                      </div>
                      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] text-slate-400">
                        {[
                          'sin(2)',
                          '9÷R4',
                          'd(X^2,3)',
                          'integral(X,0,2)',
                          'sum(X,1,5)',
                          'solve(X^2-4,1)',
                          'normalcdf(-1,1,0,1)',
                          'binompdf(2,5,0.5)',
                        ].map(sample => (
                          <button
                            key={sample}
                            onClick={() => {
                              setExpr(sample);
                              setCursorIdx(sample.length);
                              triggerClickAudio();
                            }}
                            className="rounded bg-slate-950/80 border border-slate-800 px-2 py-1 text-left font-mono hover:border-teal-500 hover:text-teal-300 transition-colors"
                          >
                            {sample}
                          </button>
                        ))}
                      </div>
                      <div className="mt-3 text-[11px] text-slate-500">
                        常量菜单 {SCIENTIFIC_CONSTANTS.length} 项，单位换算菜单 {UNIT_CONVERSIONS.length} 项；矩阵、向量、统计、复数和 Base-N 已在核心模块提供函数入口，后续可继续做成完整菜单式工作流。
                      </div>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>

          </div>

          {/* Quick-reference guidelines and credits section */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-slate-400 text-xs text-left grow-0 shrink-0">
            <div>
              <p className="font-semibold text-slate-300">💡 亲切提示 Keyboard Bindings Available:</p>
              <p className="text-[10px] mt-1 text-slate-400">
                可直接在实体键盘输入：数字 0-9、小数点 .、退格 Backspace、加减乘除 +-/* 和回车键 (Enter/=) 即可同步模拟运算。
              </p>
            </div>
            <div className="bg-slate-900 border border-slate-800/80 px-4 py-2 rounded-xl text-center md:text-right flex flex-col select-none whitespace-nowrap">
              <span className="text-[10px] text-slate-500">DESIGNER REPLICA</span>
              <span className="font-mono text-teal-400 font-bold mt-0.5">FX-991CN X CLASSWIZ</span>
            </div>
          </div>

        </div>

      </div>

      {/* Page Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 py-3 text-center text-xs text-slate-500 shrink-0">
        <p>&copy; 2026 fx-991CN X Emulator &middot; Built with React, Tailwind CSS, &amp; motion/react</p>
      </footer>

    </div>
  );
}
