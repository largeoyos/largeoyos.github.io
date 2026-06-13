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
} from './core/calculator';

// --- MATHS AUXILIARY HELPERS ---
function fact(n: number): number {
  if (n < 0 || !Number.isInteger(n)) return NaN;
  if (n > 100) return Infinity;
  if (n === 0 || n === 1) return 1;
  let res = 1;
  for (let i = 2; i <= n; i++) res *= i;
  return res;
}

function nPr(n: number, r: number): number {
  if (n < 0 || r < 0 || n < r || !Number.isInteger(n) || !Number.isInteger(r)) return NaN;
  return fact(n) / fact(n - r);
}

function nCr(n: number, r: number): number {
  if (n < 0 || r < 0 || n < r || !Number.isInteger(n) || !Number.isInteger(r)) return NaN;
  return fact(n) / (fact(r) * fact(n - r));
}

function factorize(num: number): string {
  if (num <= 1 || !Number.isInteger(num) || num > 1000000) return "";
  let temp = num;
  const factors: Record<number, number> = {};
  let divisor = 2;
  while (temp >= divisor * divisor) {
    if (temp % divisor === 0) {
      factors[divisor] = (factors[divisor] || 0) + 1;
      temp /= divisor;
    } else {
      divisor = divisor === 2 ? 3 : divisor + 2;
    }
  }
  if (temp > 1) {
    factors[temp] = (factors[temp] || 0) + 1;
  }
  
  const superscriptMap: Record<string, string> = {
    '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹'
  };
  return Object.entries(factors)
    .map(([prime, power]) => {
      if (power === 1) return prime;
      const powerStr = String(power).split('').map(char => superscriptMap[char] || char).join('');
      return `${prime}${powerStr}`;
    })
    .join(' × ');
}

// --- FULL CHINESE CASIO CORE EVALUATOR ---
interface EvalResult {
  success: boolean;
  value: number;
  displayText: string;
  isRemainder?: boolean;
  quotient?: number;
  remainder?: number;
}

function splitTopLevelArgs(input: string): string[] {
  const args: string[] = [];
  let depth = 0;
  let current = "";
  for (const char of input) {
    if (char === '(') depth++;
    if (char === ')') depth--;
    if (char === ',' && depth === 0) {
      args.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  if (current.trim()) args.push(current.trim());
  return args;
}

function completeParentheses(input: string): string {
  let depth = 0;
  for (const char of input) {
    if (char === '(') depth++;
    if (char === ')') depth--;
    if (depth < 0) {
      throw new Error("Syntax ERROR");
    }
  }
  return input + ')'.repeat(depth);
}

function normalizeExpression(
  formula: string,
  variables: Record<string, number>,
  ans: number
): string {
  let f = formula.trim();

  f = f.replaceAll('×', '*');
  f = f.replaceAll('÷', '/');
  f = f.replaceAll('−', '-');
  f = f.replaceAll('√(', 'sqrt(');
  f = f.replaceAll('³√(', 'cbrt(');
  f = f.replaceAll('sin⁻¹(', 'asin(');
  f = f.replaceAll('cos⁻¹(', 'acos(');
  f = f.replaceAll('tan⁻¹(', 'atan(');
  f = f.replaceAll('Abs(', 'abs(');
  f = f.replaceAll('FACT', 'fact');
  f = f.replaceAll('Ran#', 'rand()');
  f = f.replaceAll('π', 'PI');
  f = f.replace(/\bAns\b/g, `(${ans})`);
  f = f.replace(/\be\b/g, 'E_CONST');

  // Scientific notation key: 3E5 -> 3*10^5, 1E-3 -> 1*10^-3.
  f = f.replace(/(\d+(?:\.\d+)?|\))E([+-]?\d+(?:\.\d+)?)/g, '$1*10^$2');

  for (const key of ['A', 'B', 'C', 'D', 'E', 'F', 'X', 'Y', 'M']) {
    const regex = new RegExp(`\\b${key}\\b`, 'g');
    f = f.replace(regex, `(${variables[key] || 0})`);
  }

  f = f.replace(/(\d+(?:\.\d+)?)!/g, (_, n) => `fact(${n})`);
  f = f.replace(/(\d+(?:\.\d+)?|\([^()]+\))%/g, '($1/100)');
  f = f.replace(/²/g, '**2');
  f = f.replace(/³/g, '**3');
  f = f.replace(/⁻¹/g, '**(-1)');
  f = f.replace(/\^/g, '**');
  f = f.replace(/(\d+(?:\.\d+)?)\s*P\s*(\d+(?:\.\d+)?)/g, 'nPr($1,$2)');
  f = f.replace(/(\d+(?:\.\d+)?)\s*C\s*(\d+(?:\.\d+)?)/g, 'nCr($1,$2)');
  f = f.replace(/(\d+(?:\.\d+)?|\)|PI|E_CONST)(?=\()/g, '$1*');
  f = f.replace(/(\d+(?:\.\d+)?|\))(?=(PI|E_CONST)\b)/g, '$1*');
  f = f.replace(/\)(?=\d|PI|E_CONST)/g, ')*');

  return f;
}

function evaluateCasioExpr(
  expr: string, 
  variables: Record<string, number>, 
  ans: number, 
  angleMode: 'DEG' | 'RAD'
): EvalResult {
  if (!expr || expr.trim() === '') {
    return { success: true, value: 0, displayText: "0" };
  }

  try {
    const raw = completeParentheses(expr.trim());

    // Remainder division custom handler: e.g. "9÷R4" -> returns Q and R
    if (raw.includes('÷R')) {
      const parts = raw.split('÷R');
      if (parts.length === 2 && parts[0] && parts[1]) {
        const leftVal = evaluatePrimitive(parts[0], variables, ans, angleMode);
        const rightVal = evaluatePrimitive(parts[1], variables, ans, angleMode);
        if (isNaN(leftVal) || isNaN(rightVal) || rightVal === 0) {
          throw new Error("Math ERROR");
        }
        const quotient = Math.floor(leftVal / rightVal);
        const remainder = leftVal % rightVal;
        return {
          success: true,
          value: quotient,
          displayText: `Q=${quotient}, R=${remainder}`,
          isRemainder: true,
          quotient,
          remainder
        };
      }
      throw new Error("Syntax ERROR");
    }

    const vectorMatch = raw.match(/^(Pol|Rec)\((.*)\)$/);
    if (vectorMatch) {
      const [, fnName, body] = vectorMatch;
      const args = splitTopLevelArgs(body);
      if (args.length !== 2) throw new Error("Syntax ERROR");
      const first = evaluatePrimitive(args[0], variables, ans, angleMode);
      const second = evaluatePrimitive(args[1], variables, ans, angleMode);
      if (!Number.isFinite(first) || !Number.isFinite(second)) throw new Error("Math ERROR");
      if (fnName === 'Pol') {
        const r = Math.hypot(first, second);
        const thetaRad = Math.atan2(second, first);
        const theta = angleMode === 'DEG' ? thetaRad * 180 / Math.PI : thetaRad;
        return { success: true, value: r, displayText: `r=${formatCasioValue(r)}, θ=${formatCasioValue(theta)}` };
      }
      const thetaRad = angleMode === 'DEG' ? second * Math.PI / 180 : second;
      const x = first * Math.cos(thetaRad);
      const y = first * Math.sin(thetaRad);
      return { success: true, value: x, displayText: `x=${formatCasioValue(x)}, y=${formatCasioValue(y)}` };
    }

    // Process general functional expressions
    const finalValue = evaluatePrimitive(raw, variables, ans, angleMode);
    
    if (isNaN(finalValue) || !isFinite(finalValue)) {
      return { success: false, value: 0, displayText: "Math ERROR" };
    }

    return { success: true, value: finalValue, displayText: formatCasioValue(finalValue) };
  } catch (err: any) {
    return { success: false, value: 0, displayText: err.message === "Math ERROR" ? "Math ERROR" : "Syntax ERROR" };
  }
}

// Direct evaluator with Casio input mappings and a small math-only scope.
function evaluatePrimitive(
  formula: string,
  variables: Record<string, number>,
  ans: number,
  angleMode: 'DEG' | 'RAD'
): number {
  const f = normalizeExpression(completeParentheses(formula), variables, ans);

  const radFactor = angleMode === 'DEG' ? Math.PI / 180 : 1;
  const invRadFactor = angleMode === 'DEG' ? 180 / Math.PI : 1;
  const scope = {
    PI: Math.PI,
    E_CONST: Math.E,
    sin: (x: number) => Math.sin(x * radFactor),
    cos: (x: number) => Math.cos(x * radFactor),
    tan: (x: number) => Math.tan(x * radFactor),
    asin: (x: number) => Math.asin(x) * invRadFactor,
    acos: (x: number) => Math.acos(x) * invRadFactor,
    atan: (x: number) => Math.atan(x) * invRadFactor,
    sqrt: Math.sqrt,
    cbrt: Math.cbrt,
    log: Math.log10,
    ln: Math.log,
    abs: Math.abs,
    fact,
    nPr,
    nCr,
    Rnd: (x: number) => Math.round(x),
    rand: () => Math.random(),
    RanInt: (min: number, max: number) => {
      const lo = Math.ceil(Math.min(min, max));
      const hi = Math.floor(Math.max(min, max));
      return Math.floor(Math.random() * (hi - lo + 1)) + lo;
    }
  };

  if (!/^[0-9+\-*/%().,\sA-Za-z_!*]+$/.test(f)) return NaN;

  // Evaluate safely
  try {
    const result = Function(...Object.keys(scope), `"use strict"; return (${f});`)(...Object.values(scope));
    return typeof result === 'number' ? result : NaN;
  } catch {
    return NaN;
  }
}

function formatCasioValue(val: number): string {
  if (Object.is(val, -0)) return "0";
  if (!isFinite(val)) return "Math ERROR";
  const abs = Math.abs(val);
  if (abs === 0) return "0";
  if (abs >= 1e10 || abs < 1e-6) {
    return val.toExponential(8).replace(/\.?0+e/, 'e');
  }
  // Trim excessive decimal zeros
  const formatted = val.toPrecision(12);
  return String(Number(formatted));
}

type ActiveMenu = 'NONE' | 'SETUP' | 'CONST' | 'CONV' | 'RECALL' | 'STORE' | 'MAIN' | 'OPTN' | 'SOLVE' | 'CALC';
type CalcMode = 'Calculate' | 'Statistics' | 'Distribution' | 'Spreadsheet' | 'Function Table' | 'Equation' | 'Inequality' | 'Complex' | 'Base-N' | 'Matrix' | 'Vector' | 'Ratio';

const STORAGE_KEY = 'fx991cnx-registers-v1';
const VARIABLE_NAMES = ['A', 'B', 'C', 'D', 'E', 'F', 'X', 'Y', 'M'];
const DEFAULT_VARIABLES: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0, X: 0, Y: 0, M: 0 };
const MODE_OPTIONS: CalcMode[] = ['Calculate', 'Statistics', 'Distribution', 'Spreadsheet', 'Function Table', 'Equation', 'Inequality', 'Complex', 'Base-N', 'Matrix', 'Vector', 'Ratio'];
const OPTN_SAMPLES = [
  { key: '1', label: 'd/dx', insert: 'd(X,0)' },
  { key: '2', label: 'Integral', insert: 'integral(X,0,1)' },
  { key: '3', label: 'Sum', insert: 'sum(X,1,10)' },
  { key: '4', label: 'Normal CDF', insert: 'normalcdf(-1,1,0,1)' },
  { key: '5', label: 'Binomial PDF', insert: 'binompdf(2,5,0.5)' },
  { key: '6', label: 'Poisson PDF', insert: 'poissonpdf(2,3)' },
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

function toLatexText(input: string): string {
  return input
    .replaceAll('×', ' \\times ')
    .replaceAll('÷', ' \\div ')
    .replaceAll('π', '\\pi')
    .replaceAll('√(', '\\sqrt(')
    .replaceAll('sin⁻¹', '\\sin^{-1}')
    .replaceAll('cos⁻¹', '\\cos^{-1}')
    .replaceAll('tan⁻¹', '\\tan^{-1}')
    .replaceAll('²', '^{2}')
    .replaceAll('³', '^{3}')
    .replaceAll('⁻¹', '^{-1}')
    .replace(/\^/g, '^');
}

// --- MAIN APP ---
export default function App() {
  // Calculator logical states
  const [powerActive, setPowerActive] = useState<boolean>(true);
  const [expr, setExpr] = useState<string>("");
  const [cursorIdx, setCursorIdx] = useState<number>(0);
  const [ans, setAns] = useState<number>(0);
  const [resultVal, setResultVal] = useState<string>("0");
  const [variables, setVariables] = useState<Record<string, number>>(() => loadStoredVariables());
  const [calcMode, setCalcMode] = useState<CalcMode>('Calculate');
  const [latexEnabled, setLatexEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem('fx991cnx-latex-display') === '1';
  });

  // Mode helpers
  const [shiftActive, setShiftActive] = useState<boolean>(false);
  const [alphaActive, setAlphaActive] = useState<boolean>(false);
  const [angleMode, setAngleMode] = useState<'DEG' | 'RAD'>('DEG');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Advanced contextual screens
  const [activeMenu, setActiveMenu] = useState<ActiveMenu>('NONE');
  const [menuScrollIdx, setMenuScrollIdx] = useState<number>(0);
  const [historyList, setHistoryList] = useState<Array<{ expr: string; res: string; timestamp: string }>>([
    { expr: "sin(30) × 4", res: "2", timestamp: "15:20" },
    { expr: "5! + 10", res: "130", timestamp: "15:18" }
  ]);

  // Sidebar / Interactive variables panel
  const [activeTab, setActiveTab] = useState<'history' | 'variables' | 'manual'>('history');

  // Input textbox reference
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(variables));
    } catch {
      // localStorage can be unavailable in private or locked-down contexts.
    }
  }, [variables]);

  useEffect(() => {
    try {
      window.localStorage.setItem('fx991cnx-latex-display', latexEnabled ? '1' : '0');
    } catch {
      // Ignore persistence failures.
    }
  }, [latexEnabled]);

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
    const evalRes = evaluateExpression(formula, { variables: nextVariables, ans, angleMode });
    if (evalRes.success) {
      setAns(evalRes.value);
      setResultVal(evalRes.displayText);
      const date = new Date();
      const timestamp = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
      setHistoryList(prev => [
        { expr: formula, res: evalRes.displayText, timestamp },
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
      setAns(solveRes.value);
      setVariables(prev => ({ ...prev, [name]: solveRes.value }));
      setResultVal(solveRes.displayText);
    } else {
      setResultVal(solveRes.displayText);
    }
    setActiveMenu('NONE');
  };

  const handleSolveRequest = () => {
    if (!expr.includes('=')) {
      setResultVal("Solve needs =");
      return;
    }
    const vars = extractVariables(expr);
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
    const vars = extractVariables(expr);
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

  // Handle keys inputs on the virtual keypads
  const handleKeypress = (action: string, value?: string, shiftValue?: string, alphaValue?: string) => {
    triggerClickAudio();

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
          const parsed = Number(resultVal);
          if (!isNaN(parsed) && parsed > 1 && Number.isInteger(parsed)) {
            const factorsStr = factorizeInteger(parsed) || factorize(parsed);
            if (factorsStr) {
              setResultVal(`${parsed}=${factorsStr}`);
            }
          }
          setShiftActive(false);
          return;
        }
        if (shiftValue === 'CONST_MENU') {
          setActiveMenu('CONST');
          setShiftActive(false);
          return;
        }
        if (shiftValue === 'CONV_MENU') {
          setActiveMenu('CONV');
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
      if (activeMenu === 'MAIN') {
        const idx = activeVal === '0' ? 9 : Number(activeVal) - 1;
        if (Number.isInteger(idx) && MODE_OPTIONS[idx]) {
          setCalcMode(MODE_OPTIONS[idx]);
          setResultVal(MODE_OPTIONS[idx]);
        }
        setActiveMenu('NONE');
        return;
      }
      if (activeMenu === 'OPTN') {
        const selected = OPTN_SAMPLES.find(item => item.key === activeVal);
        if (selected) {
          insertTextAtCursor(selected.insert);
        }
        setActiveMenu('NONE');
        return;
      }
      if (activeMenu === 'SOLVE') {
        if (VARIABLE_NAMES.includes(activeVal)) {
          runSolveFor(activeVal);
          return;
        }
        const idx = Number(activeVal) - 1;
        const vars = extractVariables(expr);
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
          setLatexEnabled(prev => !prev);
          setActiveMenu('NONE');
        } else {
          setActiveMenu('NONE');
        }
        return;
      }
      if (activeMenu === 'CONST') {
        // Physical Constants standard
        const selected = SCIENTIFIC_CONSTANTS.find(item => item.key === activeVal);
        if (selected) {
          insertTextAtCursor(String(selected.value));
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

    // --- BUTTON EVENT ROUTER ---
    switch (activeAction) {
      case 'shift': 
        setShiftActive(prev => !prev);
        setAlphaActive(false);
        break;
      case 'alpha':
        setAlphaActive(prev => !prev);
        setShiftActive(false);
        break;
      case 'clear':
        setExpr("");
        setResultVal("0");
        setCursorIdx(0);
        break;
      case 'backspace':
        if (expr.length > 0 && cursorIdx > 0) {
          const before = expr.slice(0, cursorIdx - 1);
          const after = expr.slice(cursorIdx);
          setExpr(before + after);
          setCursorIdx(cursorIdx - 1);
        }
        break;
      case 'arrow_left':
        setCursorIdx(prev => Math.max(0, prev - 1));
        break;
      case 'arrow_right':
        setCursorIdx(prev => Math.min(expr.length, prev + 1));
        break;
      case 'menu':
        setActiveMenu('MAIN');
        break;
      case 'optn':
        setActiveMenu('OPTN');
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
      case 'evaluate':
        handleEvaluation();
        break;
      case 'append':
        insertTextAtCursor(activeVal);
        break;
      case 'change_angle':
        setAngleMode(prev => prev === 'DEG' ? 'RAD' : 'DEG');
        break;
    }
  };

  const insertTextAtCursor = (txt: string) => {
    const before = expr.slice(0, cursorIdx);
    const after = expr.slice(cursorIdx);
    setExpr(before + txt + after);
    setCursorIdx(cursorIdx + txt.length);
  };

  const handleEvaluation = () => {
    const evalRes = evaluateExpression(expr, { variables, ans, angleMode });
    if (evalRes.success) {
      setAns(evalRes.value);
      setResultVal(evalRes.displayText);
      
      // Save history log
      const date = new Date();
      const timestamp = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
      setHistoryList(prev => [
        { expr, res: evalRes.displayText, timestamp },
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
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [expr, cursorIdx, variables, ans, angleMode, powerActive]);

  // Generate cursor visual index
  const renderExpressionWithCursor = () => {
    if (!powerActive) return "";
    if (latexEnabled) {
      return (
        <span className="font-serif text-[13px] tracking-normal leading-relaxed">
          {`$${toLatexText(expr || "0")}$`}
        </span>
      );
    }
    if (expr === "") return <span className="text-gray-700 animate-pulse">■</span>;

    const before = expr.slice(0, cursorIdx);
    const after = expr.slice(cursorIdx);

    return (
      <span className="leading-relaxed tracking-wider">
        {before}
        <span className="bg-[#152e18] text-[#9fb08f] px-[1px] font-bold animate-pulse">|</span>
        {after}
      </span>
    );
  };

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
            onClick={() => setLatexEnabled(prev => !prev)}
            className={`px-3 py-1.5 rounded-lg transition-colors border text-xs font-mono font-bold ${latexEnabled ? 'bg-teal-950 border-teal-700 text-teal-300' : 'bg-slate-900 border-slate-800 text-slate-400'}`}
            title="Toggle LaTeX display"
          >
            LaTeX
          </button>
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
                  {/* Subtle pixel line horizontal alignment overlays */}
                  <div className="absolute inset-0 bg-repeat bg-[linear-gradient(rgba(0,0,0,0.045)_1px,_transparent_1.5px)] bg-[size:100%_4px] pointer-events-none z-[4]" />
                  <div className="absolute inset-0 bg-repeat bg-[linear-gradient(90deg,_rgba(0,0,0,0.03)_1px,_transparent_1.5px)] bg-[size:3px_100%] pointer-events-none z-[4]" />

                  {/* LCD Screen On Glass shine overlay */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none transform -skew-x-12 scale-125 z-[5]" />

                  {/* Top indicators row */}
                  <div className="flex justify-between items-center text-[8px] font-extrabold tracking-wider leading-none shrink-0 text-slate-800/80 uppercase">
                    <div className="flex gap-1.5">
                      <span className={`px-0.5 rounded ${shiftActive ? 'bg-slate-900 text-[#a9ba96]' : 'opacity-20'}`}>S</span>
                      <span className={`px-0.5 rounded ${alphaActive ? 'bg-slate-900 text-[#a9ba96]' : 'opacity-20'}`}>A</span>
                    </div>
                    
                    <div className="flex gap-2">
                      <span className={angleMode === 'DEG' ? 'font-black underline scale-110' : 'opacity-25'}>DEG</span>
                      <span className={angleMode === 'RAD' ? 'font-black underline scale-110' : 'opacity-25'}>RAD</span>
                      <span className="font-black">{calcMode}</span>
                      <span className={latexEnabled ? 'font-black underline' : 'opacity-25'}>TEX</span>
                      <span className="font-extrabold px-0.5 bg-slate-900 text-[#a9ba96]/95 scale-90 rounded">MATH</span>
                    </div>
                  </div>

                  {/* Screen Content Core */}
                  {powerActive ? (
                    <div className="flex-1 flex flex-col justify-between mt-1 z-[6]">
                      {activeMenu === 'NONE' ? (
                        <>
                          {/* Inner Formula edit line */}
                          <div className="text-sm select-all font-semibold leading-relaxed tracking-wider break-all text-left">
                            {renderExpressionWithCursor()}
                          </div>
                          {/* Inner Result Display line */}
                          <div className="text-right text-xl font-black font-mono leading-none tracking-normal pt-1 select-all break-normal pr-1 select-none">
                            {resultVal}
                          </div>
                        </>
                      ) : (
                        /* Menu Lists screens */
                        <div className="text-[10px] uppercase font-bold text-slate-900 leading-tight flex flex-col flex-1 py-1">
                          {activeMenu === 'MAIN' && (
                            <>
                              <div className="border-b border-slate-800/20 pb-0.5 text-center">MENU MODE SELECT</div>
                              <div className="mt-1 grid grid-cols-2 gap-x-1 gap-y-0.5 text-[8.5px] text-left">
                                {MODE_OPTIONS.slice(0, 10).map((mode, idx) => (
                                  <div key={mode}>{idx === 9 ? 0 : idx + 1}: {calcMode === mode ? '☑' : '☐'} {mode}</div>
                                ))}
                              </div>
                            </>
                          )}
                          {activeMenu === 'OPTN' && (
                            <>
                              <div className="border-b border-slate-800/20 pb-0.5 text-center">OPTN FUNCTION BOX</div>
                              <div className="mt-1 grid grid-cols-2 gap-x-1 gap-y-0.5 text-[8.5px] text-left">
                                {OPTN_SAMPLES.map(item => (
                                  <div key={item.key}>{item.key}: ☐ {item.label}</div>
                                ))}
                              </div>
                            </>
                          )}
                          {activeMenu === 'SOLVE' && (
                            <>
                              <div className="border-b border-slate-800/20 pb-0.5 text-center">SOLVE VARIABLE SELECT</div>
                              <div className="mt-1 grid grid-cols-3 gap-0.5 text-[8.5px] text-left">
                                {extractVariables(expr).map((name, idx) => (
                                  <div key={name}>{idx + 1}: ☐ {name}={formatCoreValue(variables[name] || 0)}</div>
                                ))}
                              </div>
                              <div className="mt-1 text-[8px] normal-case">Other variables use stored register values.</div>
                            </>
                          )}
                          {activeMenu === 'SETUP' && (
                            <>
                              <div className="border-b border-slate-800/20 pb-0.5 text-center">设置菜单 SETUP MENU</div>
                              <div className="mt-1 font-semibold space-y-0.5 text-left">
                                <div>1: 角度 - DEG (度数单位)</div>
                                <div>2: 角度 - RAD (弧度单位)</div>
                                <div>3: 其它设置 (退出设定)</div>
                              </div>
                            </>
                          )}
                          {activeMenu === 'CONST' && (
                            <>
                              <div className="border-b border-slate-800/20 pb-0.5 text-center">常量库 SCI CONST</div>
                              <div className="mt-1 font-semibold grid grid-cols-2 gap-x-1 text-[9px] text-left">
                                <div>1: c (光速)</div>
                                <div>2: h (普朗克)</div>
                                <div>3: G (引力)</div>
                                <div>4: g (重力)</div>
                                <div>5: NA (阿伏)</div>
                                <div>6: R (气体常数)</div>
                              </div>
                            </>
                          )}
                          {activeMenu === 'CONV' && (
                            <>
                              <div className="border-b border-slate-800/20 pb-0.5 text-center">单位换算 UNIT CONVERSION</div>
                              <div className="mt-1 font-semibold space-y-0.5 text-[9px] text-left">
                                <div>1: inches ▶ cm (英寸到厘米)</div>
                                <div>2: cm ▶ inches (厘米到英寸)</div>
                                <div>3: kg ▶ lbs (公斤到磅)</div>
                                <div>4: lbs ▶ kg (磅到公斤)</div>
                              </div>
                            </>
                          )}
                          {activeMenu === 'RECALL' && (
                            <>
                              <div className="border-b border-slate-800/20 pb-0.5 text-center">调用变量 RECALL VARS</div>
                              <div className="mt-1 text-[8px] font-sans grid grid-cols-3 gap-0.5 tracking-tight text-left font-black">
                                {Object.entries(variables).map(([name, val]) => (
                                  <div key={name} className="truncate bg-black/5 rounded p-0.5">
                                    {name}: {formatCasioValue(val as number)}
                                  </div>
                                ))}
                              </div>
                            </>
                          )}
                          {activeMenu === 'STORE' && (
                            <>
                              <div className="border-b border-slate-800/20 pb-0.5 text-center font-bold text-red-800">变量存入 (STO ▶ 选择变量)</div>
                              <div className="mt-1 font-semibold text-center text-[9px] text-slate-800 leading-normal animate-pulse">
                                请按 A, B, C, D, E, F, X, Y 或 M 对应的按键，将当前结果存入该变量内存中
                              </div>
                            </>
                          )}
                        </div>
                      )}

                    </div>
                  ) : (
                    /* Blank Screen when Powered Off */
                    <div className="flex-1 flex items-center justify-center text-[10px] text-slate-900/30">
                      SYSTEM SLEEP
                    </div>
                  )}

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
                      onClick={() => handleKeypress('arrow_left')} // Simple scroll fallback
                      className="absolute top-1 w-7 h-6 text-stone-400 hover:text-white transition-colors flex items-center justify-center text-xs font-bold active:scale-90"
                      title="上"
                    >
                      ▲
                    </button>
                    <button 
                      onClick={() => handleKeypress('arrow_right')}
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
                    onClick={() => handleKeypress('append', 'log(', '10^')}
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
                    onClick={() => handleKeypress('append', 'E', '←', 'i')}
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
                    onClick={() => handleKeypress('append', '', 'Y', 'Y')} // Dummy conversion step
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
                    onClick={() => handleKeypress('append', 'M+', 'M-', 'M')}
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
