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
import type { AngleMode } from './calculator';

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
      { key: '3', label: 'CONJUGATE', command: 'conjugate' },
      { key: '4', label: 'ARGUMENT', command: 'argument' },
      { key: '5', label: 'REAL PART', command: 'real' },
      { key: '6', label: 'IMAG PART', command: 'imaginary' },
      { key: '7', label: 'a+bi', command: 'rectangular' },
      { key: '8', label: 'r∠θ', command: 'polar' },
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
      { key: '2', label: 'MatA', insert: 'MatA' },
      { key: '3', label: 'MatB', insert: 'MatB' },
      { key: '4', label: 'MatC', insert: 'MatC' },
      { key: '5', label: 'MatD', insert: 'MatD' },
      { key: '6', label: 'MatAns', insert: 'MatAns' },
      { key: '7', label: 'Det', insert: 'Det(' },
      { key: '8', label: 'Trn', insert: 'Trn(' },
      { key: '9', label: 'Identity', insert: 'Identity(' },
      { key: '0', label: 'Inv', insert: 'Inv(' },
    ];
  }
  if (mode === 'Vector') {
    return [
      { key: '1', label: 'DEFINE VECTOR', command: 'define-vector' },
      { key: '2', label: 'VctA', insert: 'VctA' },
      { key: '3', label: 'VctB', insert: 'VctB' },
      { key: '4', label: 'VctC', insert: 'VctC' },
      { key: '5', label: 'VctD', insert: 'VctD' },
      { key: '6', label: 'VctAns', insert: 'VctAns' },
      { key: '7', label: 'Dot', insert: 'Dot(' },
      { key: '8', label: 'Angle', insert: 'Angle(' },
      { key: '9', label: 'Unit', insert: 'Unit(' },
      { key: '0', label: 'Cross', insert: 'Cross(' },
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
  const binary = splitTopLevel(expression, ['+', '-', '×', '*']);
  if (binary) {
    const left = parseMatrix(binary.left, memory);
    const rightText = binary.right.trim();
    if (/^-?\d+(?:\.\d+)?$/.test(rightText) && (binary.operator === '×' || binary.operator === '*')) {
      return matrixScale(left, Number(rightText));
    }
    const right = parseMatrix(binary.right, memory);
    if (binary.operator === '+') return matrixAdd(left, right);
    if (binary.operator === '-') return matrixSubtract(left, right);
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
  const powerMatch = expression.match(/^(.+)\^(-?\d+)$/);
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
  const call = expression.match(/^(Dot|Angle|Unit|Cross)\((.*)\)$/i);
  if (call) {
    const args = call[2].split(',').map(value => value.trim());
    if (/^Unit$/i.test(call[1])) {
      const vector = vectorUnit(vectorVariable(args[0], memory));
      return { display: `[${vector.join(',')}]`, vector };
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
    const left = vectorVariable(binary.left, memory);
    const rightText = binary.right.trim();
    if (/^-?\d+(?:\.\d+)?$/.test(rightText)) {
      const vector = vectorScale(left, Number(rightText));
      return { display: `[${vector.join(',')}]`, vector };
    }
    const right = vectorVariable(binary.right, memory);
    const vector = binary.operator === '+'
      ? vectorAdd(left, right)
      : binary.operator === '-'
        ? vectorSubtract(left, right)
        : vectorScale(left, vectorNorm(right));
    return { display: `[${vector.join(',')}]`, vector };
  }
  const vector = vectorVariable(expression, memory);
  return { display: `[${vector.join(',')}]`, vector };
}

export function evaluateModeExpression(
  mode: CalcMode,
  input: string,
  memory: ModeMemory,
  variables: Record<string, number>,
  angleMode: AngleMode,
): ModeEvaluation {
  if (mode === 'Complex') {
    const complex = evaluateComplexExpression(input, angleMode, variables);
    return { display: formatComplex(complex), complex };
  }
  if (mode === 'Base-N') {
    const raw = evaluateBaseExpression(input, memory.base);
    const numeric = memory.base === 2 ? ((raw & 0xffff) > 0x7fff ? (raw & 0xffff) - 0x1_0000 : raw & 0xffff) : raw;
    return { display: formatBaseInteger(numeric, memory.base), numeric };
  }
  if (mode === 'Matrix') {
    const detMatch = input.trim().match(/^Det\((.+)\)$/i);
    if (detMatch) {
      const numeric = matrixDeterminant(parseMatrix(detMatch[1], memory));
      return { display: String(numeric), numeric };
    }
    const matrixValue = parseMatrix(input, memory);
    return {
      display: `[${matrixValue.map(row => row.join(',')).join(';')}]`,
      matrix: matrixValue,
    };
  }
  if (mode === 'Vector') return parseVector(input, memory, angleMode);
  throw new Error('Mode ERROR');
}

export function applyComplexResultCommand(
  command: string,
  value: ComplexValue,
  angleMode: AngleMode,
): ModeEvaluation {
  if (command === 'conjugate') {
    const complex = complexConjugate(value);
    return { display: formatComplex(complex), complex };
  }
  if (command === 'argument') {
    const numeric = complexArgument(value, angleMode);
    return { display: String(numeric), numeric };
  }
  if (command === 'real') {
    const numeric = complexReal(value);
    return { display: String(numeric), numeric };
  }
  if (command === 'imaginary') {
    const numeric = complexImag(value);
    return { display: String(numeric), numeric };
  }
  if (command === 'polar') {
    const polar = complexToPolar(value, angleMode);
    return { display: `${polar.radius}∠${polar.theta}`, complex: value };
  }
  if (command === 'rectangular') return { display: formatComplex(value), complex: value };
  const numeric = complexAbs(value);
  return { display: String(numeric), numeric };
}
