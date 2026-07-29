import {
  complexAbs,
  complexArgument,
  complexConjugate,
  complexImag,
  complexReal,
  complexToPolar,
  evaluateBaseExpression,
  evaluateComplexExpression,
  formatBaseInteger,
  formatComplex,
  matrixAdd,
  matrixDeterminant,
  matrixElementAbs,
  matrixIdentity,
  matrixInverse,
  matrixMultiply,
  matrixPower,
  matrixScale,
  matrixSubtract,
  matrixTranspose,
  vectorAdd,
  vectorAngle,
  vectorCross,
  vectorDot,
  vectorNorm,
  vectorScale,
  vectorSubtract,
  vectorUnit,
  type BaseRadix,
  type ComplexValue,
  type RegressionType,
  type StatisticsRow,
} from './domains';
import { formatCasioValue, type AngleMode, type DisplayFormatOptions, type NumberFormat } from './calculator';

export type CalcMode =
  | 'Calculate'
  | 'Complex'
  | 'Base-N'
  | 'Matrix'
  | 'Vector'
  | 'Statistics'
  | 'Function Table'
  | 'Equation'
  | 'Inequality'
  | 'Ratio';

export type MenuOption = {
  key: string;
  label: string;
  insert?: string;
  command?: string;
};

export type ModeMemory = {
  version: 2;
  matrices: Record<'MatA' | 'MatB' | 'MatC' | 'MatD', number[][] | null>;
  matAns: number[][] | null;
  vectors: Record<'VctA' | 'VctB' | 'VctC' | 'VctD', number[] | null>;
  vctAns: number[] | null;
  statistics: {
    kind: 'single' | 'double';
    frequencyEnabled: boolean;
    rows: StatisticsRow[];
    regressionType: RegressionType;
  };
  functions: {
    f: string;
    g: string;
    start: number;
    end: number;
    step: number;
  };
  base: BaseRadix;
};

export type ModeEvaluation = {
  display: string;
  numeric?: number;
  complex?: ComplexValue;
  matrix?: number[][];
  vector?: number[];
  matrixDisplay?: string[][];
  vectorDisplay?: string[];
};

export type ModeDisplayOptions = DisplayFormatOptions & {
  numberFormat?: NumberFormat;
  engineeringSymbols?: boolean;
  complexAns?: ComplexValue;
  definedFunctions?: Partial<Record<'f' | 'g', string>>;
};

export const MODE_MEMORY_KEY = 'fx991cnx-mode-memory-v2';

export function createDefaultModeMemory(): ModeMemory {
  return {
    version: 2,
    matrices: { MatA: null, MatB: null, MatC: null, MatD: null },
    matAns: null,
    vectors: { VctA: null, VctB: null, VctC: null, VctD: null },
    vctAns: null,
    statistics: {
      kind: 'single',
      frequencyEnabled: false,
      rows: [],
      regressionType: 'linear',
    },
    functions: { f: 'X', g: '', start: 0, end: 10, step: 1 },
    base: 10,
  };
}

export function loadModeMemory(): ModeMemory {
  if (typeof window === 'undefined') return createDefaultModeMemory();
  try {
    const raw = window.localStorage.getItem(MODE_MEMORY_KEY);
    if (!raw) return createDefaultModeMemory();
    const parsed = JSON.parse(raw) as Partial<ModeMemory>;
    if (parsed.version !== 2) return createDefaultModeMemory();
    return { ...createDefaultModeMemory(), ...parsed } as ModeMemory;
  } catch {
    return createDefaultModeMemory();
  }
}

export function modeOptions(mode: CalcMode): MenuOption[] {
  if (mode === 'Calculate') {
    return [
      { key: '1', label: 'HYPERBOLIC', command: 'hyperbolic' },
      { key: '2', label: 'ANGLE UNIT', command: 'angle' },
      { key: '3', label: 'ENGINEERING', command: 'engineering' },
    ];
  }
  if (mode === 'Complex') {
    return [
      { key: '1', label: 'i', insert: 'i' },
      { key: '2', label: '∠', insert: '∠' },
      { key: '3', label: 'CONJUGATE', insert: 'Conjg(' },
      { key: '4', label: 'ARGUMENT', insert: 'arg(' },
      { key: '5', label: 'REAL PART', insert: 'Rep(' },
      { key: '6', label: 'IMAG PART', insert: 'Imp(' },
      { key: '7', label: '结果→a+bi', command: 'rectangular' },
      { key: '8', label: '结果→r∠θ', command: 'polar' },
      { key: '9', label: '前式→a+bi', command: 'prefix-rectangular' },
      { key: '0', label: '前式→r∠θ', command: 'prefix-polar' },
    ];
  }
  if (mode === 'Base-N') {
    return [
      { key: '1', label: 'neg', insert: 'neg ' },
      { key: '2', label: 'not', insert: 'not ' },
      { key: '3', label: 'and', insert: ' and ' },
      { key: '4', label: 'or', insert: ' or ' },
      { key: '5', label: 'xor', insert: ' xor ' },
      { key: '6', label: 'xnor', insert: ' xnor ' },
      { key: '7', label: 'd', insert: 'd' },
      { key: '8', label: 'b', insert: 'b' },
      { key: '9', label: 'h', insert: 'h' },
      { key: '0', label: 'o', insert: 'o' },
    ];
  }
  if (mode === 'Matrix') {
    return [
      { key: '1', label: 'DEFINE MATRIX', command: 'define-matrix' },
      { key: '2', label: 'EDIT MATRIX', command: 'edit-matrix' },
      { key: '3', label: 'COPY MATRIX', command: 'copy-matrix' },
      { key: '4', label: 'MatA', insert: 'MatA' },
      { key: '5', label: 'MatB', insert: 'MatB' },
      { key: '6', label: 'MatC', insert: 'MatC' },
      { key: '7', label: 'MatD', insert: 'MatD' },
      { key: '8', label: 'MatAns', insert: 'MatAns' },
      { key: '9', label: 'Det', insert: 'Det(' },
      { key: '0', label: 'Trn', insert: 'Trn(' },
      { key: '1', label: 'Identity', insert: 'Identity(' },
      { key: '2', label: 'Abs', insert: 'Abs(' },
    ];
  }
  if (mode === 'Vector') {
    return [
      { key: '1', label: 'DEFINE VECTOR', command: 'define-vector' },
      { key: '2', label: 'EDIT VECTOR', command: 'edit-vector' },
      { key: '3', label: 'COPY VECTOR', command: 'copy-vector' },
      { key: '4', label: 'VctA', insert: 'VctA' },
      { key: '5', label: 'VctB', insert: 'VctB' },
      { key: '6', label: 'VctC', insert: 'VctC' },
      { key: '7', label: 'VctD', insert: 'VctD' },
      { key: '8', label: 'VctAns', insert: 'VctAns' },
      { key: '9', label: 'Dot', insert: 'Dot(' },
      { key: '0', label: 'Cross', insert: 'Cross(' },
      { key: '1', label: 'Angle', insert: 'Angle(' },
      { key: '2', label: 'Unit', insert: 'Unit(' },
      { key: '3', label: 'Abs', insert: 'Abs(' },
    ];
  }
  if (mode === 'Statistics') {
    return [
      { key: '1', label: '1-VAR', command: 'stats-single' },
      { key: '2', label: '2-VAR', command: 'stats-double' },
      { key: '3', label: 'DATA EDIT', command: 'stats-edit' },
      { key: '4', label: 'STAT RESULT', command: 'stats-result' },
      { key: '5', label: 'REGRESSION', command: 'stats-regression' },
      { key: '6', label: 'FREQUENCY', command: 'stats-frequency' },
      { key: '7', label: 'INSERT ROW', command: 'stats-insert' },
      { key: '8', label: 'DELETE ROW', command: 'stats-delete' },
      { key: '9', label: 'SORT X', command: 'stats-sort' },
      { key: '0', label: 'NORMAL DIST', command: 'stats-normal' },
    ];
  }
  if (mode === 'Function Table') {
    return [
      { key: '1', label: 'DEFINE F(X)', command: 'table-f' },
      { key: '2', label: 'DEFINE G(X)', command: 'table-g' },
      { key: '3', label: 'RANGE', command: 'table-range' },
      { key: '4', label: 'MAKE TABLE', command: 'table-generate' },
      { key: '5', label: 'GRAPH', command: 'table-graph' },
    ];
  }
  if (mode === 'Equation') {
    return [
      { key: '1', label: 'LINEAR SYSTEM', command: 'equation-linear' },
      { key: '2', label: 'POLYNOMIAL', command: 'equation-polynomial' },
      { key: '3', label: 'SOLVE', command: 'equation-solve' },
    ];
  }
  if (mode === 'Inequality') {
    return [
      { key: '1', label: 'DEGREE 2', command: 'inequality-2' },
      { key: '2', label: 'DEGREE 3', command: 'inequality-3' },
      { key: '3', label: 'DEGREE 4', command: 'inequality-4' },
    ];
  }
  if (mode === 'Ratio') {
    return [
      { key: '1', label: 'A:B=X:D', command: 'ratio-left' },
      { key: '2', label: 'A:B=C:X', command: 'ratio-right' },
    ];
  }
  return [];
}

function splitTopLevel(input: string, operators: string[]): { left: string; operator: string; right: string } | undefined {
  let depth = 0;
  for (let index = input.length - 1; index >= 0; index--) {
    const char = input[index];
    if (char === ')') depth++;
    if (char === '(') depth--;
    if (depth !== 0) continue;
    for (const operator of operators) {
      if (input.slice(index - operator.length + 1, index + 1) === operator) {
        const start = index - operator.length + 1;
        return { left: input.slice(0, start), operator, right: input.slice(index + 1) };
      }
    }
  }
  return undefined;
}

function matrixVariable(input: string, memory: ModeMemory): number[][] {
  const key = input.trim() as keyof ModeMemory['matrices'] | 'MatAns';
  const value = key === 'MatAns' ? memory.matAns : memory.matrices[key as keyof ModeMemory['matrices']];
  if (!value) throw new Error('Undefined');
  return value;
}

function parseMatrix(input: string, memory: ModeMemory): number[][] {
  const expression = input.trim();
  const binary = splitTopLevel(expression, ['+', '-', '×', '*', '÷', '/']);
  if (binary) {
    const leftText = binary.left.trim();
    const rightText = binary.right.trim();
    const isMultiply = binary.operator === '×' || binary.operator === '*';
    if (isMultiply && /^-?\d+(?:\.\d+)?$/.test(leftText)) {
      return matrixScale(parseMatrix(binary.right, memory), Number(leftText));
    }
    const left = parseMatrix(binary.left, memory);
    if (isMultiply && /^-?\d+(?:\.\d+)?$/.test(rightText)) {
      return matrixScale(left, Number(rightText));
    }
    if ((binary.operator === '÷' || binary.operator === '/') && /^-?\d+(?:\.\d+)?$/.test(rightText)) {
      const divisor = Number(rightText);
      if (divisor === 0) throw new Error('Math ERROR');
      return matrixScale(left, 1 / divisor);
    }
    const right = parseMatrix(binary.right, memory);
    if (binary.operator === '+') return matrixAdd(left, right);
    if (binary.operator === '-') return matrixSubtract(left, right);
    if (binary.operator === '÷' || binary.operator === '/') throw new Error('Dimension ERROR');
    return matrixMultiply(left, right);
  }
  const functionMatch = expression.match(/^(Det|Trn|Inv|Abs)\((.+)\)$/i);
  if (functionMatch) {
    const value = parseMatrix(functionMatch[2], memory);
    if (/^Trn$/i.test(functionMatch[1])) return matrixTranspose(value);
    if (/^Inv$/i.test(functionMatch[1])) return matrixInverse(value);
    if (/^Abs$/i.test(functionMatch[1])) return matrixElementAbs(value);
    throw new Error(String(matrixDeterminant(value)));
  }
  const identity = expression.match(/^Identity\((\d+)\)$/i);
  if (identity) return matrixIdentity(Number(identity[1]));
  const fixedPower = expression.match(/^(.+?)(²|³|⁻¹)$/);
  if (fixedPower) {
    const exponent = fixedPower[2] === '²' ? 2 : fixedPower[2] === '³' ? 3 : -1;
    return matrixPower(parseMatrix(fixedPower[1], memory), exponent);
  }
  const powerMatch = expression.match(/^(.+)\^(?:\()?(-?\d+)(?:\))?$/);
  if (powerMatch) return matrixPower(parseMatrix(powerMatch[1], memory), Number(powerMatch[2]));
  return matrixVariable(expression, memory);
}

function vectorVariable(input: string, memory: ModeMemory): number[] {
  const key = input.trim() as keyof ModeMemory['vectors'] | 'VctAns';
  const value = key === 'VctAns' ? memory.vctAns : memory.vectors[key as keyof ModeMemory['vectors']];
  if (!value) throw new Error('Undefined');
  return value;
}

function parseVector(input: string, memory: ModeMemory, angleMode: AngleMode): ModeEvaluation {
  const expression = input.trim();
  const call = expression.match(/^(Dot|Angle|Unit|Cross|Abs)\((.*)\)$/i);
  if (call) {
    const args = call[2].split(',').map(value => value.trim());
    if (/^Unit$/i.test(call[1])) {
      const vector = vectorUnit(vectorVariable(args[0], memory));
      return { display: `[${vector.join(',')}]`, vector };
    }
    if (/^Abs$/i.test(call[1])) {
      const numeric = vectorNorm(vectorVariable(args[0], memory));
      return { display: String(numeric), numeric };
    }
    const left = vectorVariable(args[0], memory);
    const right = vectorVariable(args[1], memory);
    if (/^Dot$/i.test(call[1])) {
      const numeric = vectorDot(left, right);
      return { display: String(numeric), numeric };
    }
    if (/^Angle$/i.test(call[1])) {
      const numeric = vectorAngle(left, right, angleMode);
      return { display: String(numeric), numeric };
    }
    const vector = vectorCross(left, right);
    return { display: `[${vector.join(',')}]`, vector };
  }
  const binary = splitTopLevel(expression, ['+', '-', '×', '*']);
  if (binary) {
    const leftText = binary.left.trim();
    const rightText = binary.right.trim();
    const isMultiply = binary.operator === '×' || binary.operator === '*';
    if (isMultiply && /^-?\d+(?:\.\d+)?$/.test(leftText)) {
      const vector = vectorScale(vectorVariable(binary.right, memory), Number(leftText));
      return { display: `[${vector.join(',')}]`, vector };
    }
    const left = vectorVariable(binary.left, memory);
    if (isMultiply && /^-?\d+(?:\.\d+)?$/.test(rightText)) {
      const vector = vectorScale(left, Number(rightText));
      return { display: `[${vector.join(',')}]`, vector };
    }
    const right = vectorVariable(binary.right, memory);
    const vector = binary.operator === '+'
      ? vectorAdd(left, right)
      : binary.operator === '-'
        ? vectorSubtract(left, right)
        : vectorCross(left, right);
    return { display: `[${vector.join(',')}]`, vector };
  }
  const vector = vectorVariable(expression, memory);
  return { display: `[${vector.join(',')}]`, vector };
}

const ENGINEERING_SYMBOLS: Record<number, string> = {
  [-15]: 'f', [-12]: 'p', [-9]: 'n', [-6]: 'μ', [-3]: 'm',
  [3]: 'k', [6]: 'M', [9]: 'G', [12]: 'T', [15]: 'P', [18]: 'E',
};

function formatModeValue(
  value: number,
  options: ModeDisplayOptions,
  displayOptions: DisplayFormatOptions,
): string {
  if (options.engineeringSymbols && value !== 0 && Number.isFinite(value)) {
    const exponent = Math.floor(Math.log10(Math.abs(value)) / 3) * 3;
    const symbol = ENGINEERING_SYMBOLS[exponent];
    if (symbol) return `${formatCasioValue(value / 10 ** exponent, options.numberFormat, displayOptions)}${symbol}`;
  }
  return formatCasioValue(value, options.numberFormat, displayOptions);
}

export function evaluateModeExpression(
  mode: CalcMode,
  input: string,
  memory: ModeMemory,
  variables: Record<string, number>,
  angleMode: AngleMode,
  options: ModeDisplayOptions = {},
): ModeEvaluation {
  const displayOptions = { decimalPoint: options.decimalPoint, digitSeparator: options.digitSeparator };
  const format = (value: number) => formatModeValue(value, options, displayOptions);
  if (mode === 'Complex') {
    const complex = evaluateComplexExpression(
      input,
      angleMode,
      variables,
      options.complexAns ?? 0,
      { definedFunctions: options.definedFunctions },
    );
    return { display: formatComplex(complex, options.numberFormat, displayOptions), complex };
  }
  if (mode === 'Base-N') {
    const raw = evaluateBaseExpression(input, memory.base);
    return { display: formatBaseInteger(raw, memory.base), numeric: raw };
  }
  if (mode === 'Matrix') {
    const detMatch = input.trim().match(/^Det\((.+)\)$/i);
    if (detMatch) {
      const numeric = matrixDeterminant(parseMatrix(detMatch[1], memory));
      return { display: format(numeric), numeric };
    }
    const matrixValue = parseMatrix(input, memory);
    const matrixDisplay = matrixValue.map(row => row.map(format));
    return {
      display: `[${matrixDisplay.map(row => row.join(',')).join(';')}]`,
      matrix: matrixValue,
      matrixDisplay,
    };
  }
  if (mode === 'Vector') {
    const evaluation = parseVector(input, memory, angleMode);
    if (evaluation.numeric !== undefined) evaluation.display = format(evaluation.numeric);
    if (evaluation.vector) {
      evaluation.vectorDisplay = evaluation.vector.map(format);
      evaluation.display = `[${evaluation.vectorDisplay.join(',')}]`;
    }
    return evaluation;
  }
  throw new Error('Mode ERROR');
}

export function applyComplexResultCommand(
  command: string,
  value: ComplexValue,
  angleMode: AngleMode,
  options: ModeDisplayOptions = {},
): ModeEvaluation {
  const displayOptions = { decimalPoint: options.decimalPoint, digitSeparator: options.digitSeparator };
  const format = (numeric: number) => formatModeValue(numeric, options, displayOptions);
  if (command === 'conjugate') {
    const complex = complexConjugate(value);
    return { display: formatComplex(complex, options.numberFormat, displayOptions), complex };
  }
  if (command === 'argument') {
    const numeric = complexArgument(value, angleMode);
    return { display: format(numeric), numeric };
  }
  if (command === 'real') {
    const numeric = complexReal(value);
    return { display: format(numeric), numeric };
  }
  if (command === 'imaginary') {
    const numeric = complexImag(value);
    return { display: format(numeric), numeric };
  }
  if (command === 'polar') {
    const polar = complexToPolar(value, angleMode);
    return { display: `${format(polar.radius)}∠${format(polar.theta)}`, complex: value };
  }
  if (command === 'rectangular') return { display: formatComplex(value, options.numberFormat, displayOptions), complex: value };
  const numeric = complexAbs(value);
  return { display: format(numeric), numeric };
}
