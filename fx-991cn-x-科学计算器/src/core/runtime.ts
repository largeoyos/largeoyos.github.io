import { evaluateExpression, type AngleMode } from './calculator';
import {
  doubleVariableStatistics,
  formatComplex,
  generateFunctionTable,
  regression,
  singleVariableStatistics,
  solveLinearSystem,
  solvePolynomial,
  solvePolynomialInequality,
  type ComplexValue,
  type InequalityOperator,
  type RegressionType,
  type StatisticsRow,
} from './domains';
import type { NumberFormat, ResultMode } from './calculator';
import {
  exactRational,
  quadraticExactRoots,
  rationalFromExact,
  solveLinearSystemExact,
  type ExactValue,
  type Rational,
} from './exact';
import { exactValueDecimal, exactValueToFormulaDocument } from '../math/exactDisplay';
import {
  applyComplexResultCommand,
  createDefaultModeMemory,
  evaluateModeExpression,
  modeOptions,
  type CalcMode,
  type MenuOption,
  type ModeEvaluation,
  type ModeMemory,
} from './modes';

export type RuntimeContext = {
  variables: Record<string, number>;
  angleMode: AngleMode;
  ans: number;
  exactVariables?: Partial<Record<string, ExactValue>>;
  exactAns?: ExactValue;
  resultMode?: ResultMode;
  numberFormat?: NumberFormat;
};

type MenuScreen = {
  kind: 'menu';
  title: string;
  options: MenuOption[];
  selected: number;
};

type DimensionScreen = {
  kind: 'dimension';
  target: 'MatA' | 'MatB' | 'MatC' | 'MatD' | 'VctA' | 'VctB' | 'VctC' | 'VctD';
  stage: 'rows' | 'columns' | 'size';
  rows: number;
  columns: number;
  buffer: string;
};

type MatrixEditorScreen = {
  kind: 'matrix-editor';
  target: 'MatA' | 'MatB' | 'MatC' | 'MatD';
  values: number[][];
  row: number;
  column: number;
  buffer: string;
};

type VectorEditorScreen = {
  kind: 'vector-editor';
  target: 'VctA' | 'VctB' | 'VctC' | 'VctD';
  values: number[];
  index: number;
  buffer: string;
};

type StatisticsEditorScreen = {
  kind: 'statistics-editor';
  rows: StatisticsRow[];
  row: number;
  column: number;
  buffer: string;
};

type FunctionEditorScreen = {
  kind: 'function-editor';
  target: 'f' | 'g';
  buffer: string;
};

type RangeEditorScreen = {
  kind: 'range-editor';
  values: [number, number, number];
  index: number;
  buffer: string;
};

type CoefficientEditorScreen = {
  kind: 'coefficient-editor';
  problem: 'linear' | 'polynomial' | 'inequality';
  size: number;
  values: number[][];
  exactValues: Array<Array<Rational | null>>;
  expressions: string[][];
  row: number;
  column: number;
  buffer: string;
  operator?: InequalityOperator;
};

type TableScreen = {
  kind: 'table';
  rows: Array<{ x: number; f?: number; g?: number }>;
  page: number;
};

type GraphScreen = {
  kind: 'graph';
  rows: Array<{ x: number; f?: number; g?: number }>;
};

type RuntimeSolutionEntry = {
  label: string;
  decimal: string;
  exact?: ExactValue;
};

type SolutionsScreen = {
  kind: 'solutions';
  entries?: RuntimeSolutionEntry[];
  lines?: string[];
  selected: number;
  showDecimal?: boolean;
  decimalEntries?: boolean[];
};

type MessageScreen = {
  kind: 'message';
  title: string;
  lines: string[];
};

export type RuntimeScreen =
  | { kind: 'input' }
  | MenuScreen
  | DimensionScreen
  | MatrixEditorScreen
  | VectorEditorScreen
  | StatisticsEditorScreen
  | FunctionEditorScreen
  | RangeEditorScreen
  | CoefficientEditorScreen
  | TableScreen
  | GraphScreen
  | SolutionsScreen
  | MessageScreen;

export type ModeRuntime = {
  mode: CalcMode;
  input: string;
  result: string;
  evaluated: boolean;
  screen: RuntimeScreen;
  memory: ModeMemory;
  lastEvaluation?: ModeEvaluation;
};

export type RuntimeAction =
  | { type: 'select-mode'; mode: CalcMode }
  | { type: 'append'; value: string }
  | { type: 'delete' }
  | { type: 'clear' }
  | { type: 'left' | 'right' | 'up' | 'down' }
  | { type: 'evaluate' }
  | { type: 'optn' }
  | { type: 'eng' }
  | { type: 'toggle-result' }
  | { type: 'base'; base: 2 | 8 | 10 | 16 };

export function createModeRuntime(memory = createDefaultModeMemory()): ModeRuntime {
  return {
    mode: 'Calculate',
    input: '',
    result: '0',
    evaluated: false,
    screen: { kind: 'input' },
    memory,
  };
}

function cloneRuntime(state: ModeRuntime): ModeRuntime {
  return structuredClone(state);
}

function optionScreen(mode: CalcMode): MenuScreen {
  return { kind: 'menu', title: 'OPTION', options: modeOptions(mode), selected: 0 };
}

function commitNumericBuffer(buffer: string): number {
  const value = Number(buffer || '0');
  if (!Number.isFinite(value)) throw new Error('Argument ERROR');
  return value;
}

function evaluateCoefficientBuffer(buffer: string, context: RuntimeContext): { value: number; exact: Rational | null } {
  const expression = buffer.trim() || '0';
  if (expression.includes(':')
    || /(?:==|!=|<=|>=|[=<>])/.test(expression)
    || /(^|[^A-Za-z])i($|[^A-Za-z])/i.test(expression)
    || /^\s*(?:Pol|Rec)\s*\(/i.test(expression)) {
    throw new Error('Syntax ERROR');
  }
  const result = evaluateExpression(expression, {
    variables: context.variables,
    ans: context.ans,
    angleMode: context.angleMode,
    exactVariables: context.exactVariables,
    exactAns: context.exactAns,
    resultMode: context.resultMode,
    numberFormat: context.numberFormat,
  });
  if (!result.success) throw new Error(result.errorType || 'Syntax ERROR');
  if (!Number.isFinite(result.value)) throw new Error('Math ERROR');
  return { value: result.value, exact: rationalFromExact(result.exact) ?? null };
}

function appendCoefficientInput(buffer: string, value: string): string {
  let next = buffer;
  for (const char of value) {
    if (char !== '.') {
      next += char;
      continue;
    }
    const token = next.match(/[0-9.]+$/)?.[0] ?? '';
    if (token.includes('.')) continue;
    next += /\d$/.test(token) ? '.' : '0.';
  }
  return next;
}

function editorMove<T extends MatrixEditorScreen | CoefficientEditorScreen>(
  screen: T,
  direction: 'left' | 'right' | 'up' | 'down',
): T {
  const columns = screen.values[0].length;
  let flat = screen.row * columns + screen.column;
  if (direction === 'left') flat = Math.max(0, flat - 1);
  if (direction === 'right') flat = Math.min(screen.values.length * columns - 1, flat + 1);
  if (direction === 'up') flat = Math.max(0, flat - columns);
  if (direction === 'down') flat = Math.min(screen.values.length * columns - 1, flat + columns);
  return {
    ...screen,
    row: Math.floor(flat / columns),
    column: flat % columns,
    buffer: '',
  };
}

function menuMove(screen: MenuScreen, direction: 'left' | 'right' | 'up' | 'down'): MenuScreen {
  if (screen.options.length === 0) return screen;
  if (direction === 'left' || direction === 'right') {
    const delta = direction === 'left' ? -1 : 1;
    return { ...screen, selected: (screen.selected + delta + screen.options.length) % screen.options.length };
  }

  const columns = screen.options.length >= 5 ? 4 : 1;
  if (columns === 1) {
    const delta = direction === 'up' ? -1 : 1;
    return { ...screen, selected: (screen.selected + delta + screen.options.length) % screen.options.length };
  }

  const column = screen.selected % columns;
  const sameColumn = screen.options
    .map((_, index) => index)
    .filter(index => index % columns === column);
  const position = sameColumn.indexOf(screen.selected);
  const delta = direction === 'up' ? -1 : 1;
  return { ...screen, selected: sameColumn[(position + delta + sameColumn.length) % sameColumn.length] };
}

function executeModeEvaluation(state: ModeRuntime, context: RuntimeContext): ModeRuntime {
  try {
    const evaluation = evaluateModeExpression(
      state.mode,
      state.input,
      state.memory,
      context.variables,
      context.angleMode,
    );
    const next = { ...state, result: evaluation.display, evaluated: true, lastEvaluation: evaluation };
    if (evaluation.matrix) next.memory = { ...next.memory, matAns: evaluation.matrix };
    if (evaluation.vector) next.memory = { ...next.memory, vctAns: evaluation.vector };
    return next;
  } catch (error) {
    return {
      ...state,
      result: error instanceof Error ? error.message : 'Math ERROR',
      evaluated: false,
    };
  }
}

function selectTargetMenu(kind: 'matrix' | 'vector'): MenuScreen {
  const prefix = kind === 'matrix' ? 'Mat' : 'Vct';
  return {
    kind: 'menu',
    title: kind === 'matrix' ? 'DEFINE MATRIX' : 'DEFINE VECTOR',
    selected: 0,
    options: ['A', 'B', 'C', 'D'].map((letter, index) => ({
      key: String(index + 1),
      label: `${prefix}${letter}`,
      command: `target-${prefix}${letter}`,
    })),
  };
}

function regressionLines(rows: StatisticsRow[], type: RegressionType): string[] {
  const result = regression(rows, type);
  return [
    `TYPE=${type.toUpperCase()}`,
    `a=${result.a}`,
    `b=${result.b}`,
    result.c === undefined ? `r=${result.r ?? 0}` : `c=${result.c}`,
  ];
}

function statsLines(state: ModeRuntime): string[] {
  if (state.memory.statistics.kind === 'single') {
    const stats = singleVariableStatistics(state.memory.statistics.rows);
    return [
      `n=${stats.n} mean=${stats.mean}`,
      `sx=${stats.sampleSd}`,
      `min=${stats.min} Q1=${stats.q1}`,
      `Med=${stats.median} Q3=${stats.q3}`,
      `max=${stats.max}`,
    ];
  }
  const stats = doubleVariableStatistics(state.memory.statistics.rows);
  return [
    `n=${stats.n}`,
    `meanX=${stats.meanX}`,
    `meanY=${stats.meanY}`,
    `sx=${stats.sampleSdX}`,
    `sy=${stats.sampleSdY} r=${stats.r}`,
  ];
}

function executeOption(state: ModeRuntime, option: MenuOption, context: RuntimeContext): ModeRuntime {
  if (option.insert) return { ...state, input: state.input + option.insert, screen: { kind: 'input' } };
  const command = option.command ?? '';
  if (command === 'hyperbolic') {
    return {
      ...state,
      screen: {
        kind: 'menu',
        title: 'HYPERBOLIC',
        selected: 0,
        options: ['sinh(', 'cosh(', 'tanh(', 'asinh(', 'acosh(', 'atanh('].map((insert, index) => ({
          key: String(index + 1),
          label: insert.toUpperCase(),
          insert,
        })),
      },
    };
  }
  if (command === 'angle') {
    return {
      ...state,
      screen: {
        kind: 'menu',
        title: 'ANGLE',
        selected: 0,
        options: [
          { key: '1', label: 'DEG', command: 'angle-DEG' },
          { key: '2', label: 'RAD', command: 'angle-RAD' },
          { key: '3', label: 'GRAD', command: 'angle-GRAD' },
        ],
      },
    };
  }
  if (command === 'engineering') {
    return {
      ...state,
      screen: {
        kind: 'menu',
        title: 'ENGINEERING',
        selected: 0,
        options: ['k', 'M', 'G', 'm', 'u', 'n'].map((insert, index) => ({
          key: String(index + 1),
          label: insert,
          insert,
        })),
      },
    };
  }
  if (command.startsWith('angle-')) {
    return { ...state, result: command.slice(6), screen: { kind: 'input' } };
  }
  if (state.mode === 'Complex' && state.lastEvaluation?.complex) {
    const evaluation = applyComplexResultCommand(command, state.lastEvaluation.complex, context.angleMode);
    return { ...state, result: evaluation.display, lastEvaluation: evaluation, screen: { kind: 'input' } };
  }
  if (command === 'define-matrix') return { ...state, screen: selectTargetMenu('matrix') };
  if (command === 'define-vector') return { ...state, screen: selectTargetMenu('vector') };
  if (command.startsWith('target-Mat')) {
    const target = command.slice(7) as MatrixEditorScreen['target'];
    const current = state.memory.matrices[target];
    if (current) {
      return { ...state, screen: { kind: 'matrix-editor', target, values: structuredClone(current), row: 0, column: 0, buffer: '' } };
    }
    return {
      ...state,
      screen: {
        kind: 'dimension',
        target,
        stage: 'rows',
        rows: current?.length ?? 2,
        columns: current?.[0]?.length ?? 2,
        buffer: '',
      },
    };
  }
  if (command.startsWith('target-Vct')) {
    const target = command.slice(7) as VectorEditorScreen['target'];
    const current = state.memory.vectors[target];
    if (current) {
      return { ...state, screen: { kind: 'vector-editor', target, values: [...current], index: 0, buffer: '' } };
    }
    return {
      ...state,
      screen: {
        kind: 'dimension',
        target,
        stage: 'size',
        rows: current?.length ?? 2,
        columns: 1,
        buffer: '',
      },
    };
  }
  if (command === 'stats-single' || command === 'stats-double') {
    return {
      ...state,
      memory: {
        ...state.memory,
        statistics: {
          ...state.memory.statistics,
          kind: command === 'stats-single' ? 'single' : 'double',
          rows: [],
        },
      },
      screen: { kind: 'input' },
    };
  }
  if (command === 'stats-frequency') {
    return {
      ...state,
      memory: {
        ...state.memory,
        statistics: {
          ...state.memory.statistics,
          frequencyEnabled: !state.memory.statistics.frequencyEnabled,
        },
      },
      screen: { kind: 'input' },
    };
  }
  if (command === 'stats-edit') {
    return {
      ...state,
      screen: {
        kind: 'statistics-editor',
        rows: state.memory.statistics.rows.length
          ? structuredClone(state.memory.statistics.rows)
          : [{ x: 0, y: state.memory.statistics.kind === 'double' ? 0 : undefined, freq: 1 }],
        row: 0,
        column: 0,
        buffer: '',
      },
    };
  }
  if (command === 'stats-result') {
    try {
      return { ...state, screen: { kind: 'message', title: 'STAT RESULT', lines: statsLines(state) } };
    } catch (error) {
      return { ...state, result: error instanceof Error ? error.message : 'Math ERROR', screen: { kind: 'input' } };
    }
  }
  if (command === 'stats-regression') {
    return {
      ...state,
      screen: {
        kind: 'menu',
        title: 'REGRESSION',
        selected: 0,
        options: [
          ['linear', 'Y=AX+B'],
          ['quadratic', 'Y=AX2+BX+C'],
          ['logarithmic', 'Y=A+B LN X'],
          ['exp-e', 'Y=A E^(BX)'],
          ['exp-ab', 'Y=A B^X'],
          ['power', 'Y=A X^B'],
          ['inverse', 'Y=A+B/X'],
        ].map(([type, label], index) => ({ key: String((index + 1) % 10), label, command: `regression-${type}` })),
      },
    };
  }
  if (command.startsWith('regression-')) {
    const regressionType = command.slice(11) as RegressionType;
    try {
      const memory = { ...state.memory, statistics: { ...state.memory.statistics, regressionType } };
      return { ...state, memory, screen: { kind: 'message', title: 'REGRESSION', lines: regressionLines(memory.statistics.rows, regressionType) } };
    } catch (error) {
      return { ...state, result: error instanceof Error ? error.message : 'Math ERROR', screen: { kind: 'input' } };
    }
  }
  if (command === 'stats-insert') {
    const rows = [...state.memory.statistics.rows, { x: 0, y: state.memory.statistics.kind === 'double' ? 0 : undefined, freq: 1 }];
    if (rows.length > 1000) return { ...state, result: 'Range ERROR', screen: { kind: 'input' } };
    return { ...state, memory: { ...state.memory, statistics: { ...state.memory.statistics, rows } }, screen: { kind: 'input' } };
  }
  if (command === 'stats-delete') {
    const rows = state.memory.statistics.rows.slice(0, -1);
    return { ...state, memory: { ...state.memory, statistics: { ...state.memory.statistics, rows } }, screen: { kind: 'input' } };
  }
  if (command === 'stats-sort') {
    const rows = [...state.memory.statistics.rows].sort((a, b) => a.x - b.x);
    return { ...state, memory: { ...state.memory, statistics: { ...state.memory.statistics, rows } }, screen: { kind: 'input' } };
  }
  if (command === 'table-f' || command === 'table-g') {
    const target = command === 'table-f' ? 'f' : 'g';
    return {
      ...state,
      screen: { kind: 'function-editor', target, buffer: state.memory.functions[target] },
    };
  }
  if (command === 'table-range') {
    return {
      ...state,
      screen: {
        kind: 'range-editor',
        values: [state.memory.functions.start, state.memory.functions.end, state.memory.functions.step],
        index: 0,
        buffer: '',
      },
    };
  }
  if (command === 'table-generate' || command === 'table-graph') {
    try {
      const rows = generateFunctionTable(
        state.memory.functions.f,
        state.memory.functions.g,
        state.memory.functions.start,
        state.memory.functions.end,
        state.memory.functions.step,
        context.variables,
        context.angleMode,
      );
      return { ...state, screen: command === 'table-graph' ? { kind: 'graph', rows } : { kind: 'table', rows, page: 0 } };
    } catch (error) {
      return { ...state, result: error instanceof Error ? error.message : 'Range ERROR', screen: { kind: 'input' } };
    }
  }
  if (command === 'equation-linear') {
    return {
      ...state,
      screen: {
        kind: 'menu',
        title: 'UNKNOWNS',
        selected: 0,
        options: Array.from({ length: 9 }, (_, index) => ({
          key: String((index + 2) % 10),
          label: String(index + 2),
          command: `linear-size-${index + 2}`,
        })),
      },
    };
  }
  if (command.startsWith('linear-size-')) {
    const size = Number(command.slice(12));
    return {
      ...state,
      screen: {
        kind: 'coefficient-editor',
        problem: 'linear',
        size,
        values: Array.from({ length: size }, () => Array(size + 1).fill(0)),
        exactValues: Array.from({ length: size }, () => Array<Rational | null>(size + 1).fill(null)),
        expressions: Array.from({ length: size }, () => Array(size + 1).fill('')),
        row: 0,
        column: 0,
        buffer: '',
      },
    };
  }
  if (command === 'equation-polynomial') {
    return {
      ...state,
      screen: {
        kind: 'menu',
        title: 'POLY DEGREE',
        selected: 0,
        options: [2, 3, 4].map(value => ({
          key: String(value),
          label: String(value),
          command: `poly-degree-${value}`,
        })),
      },
    };
  }
  if (command.startsWith('poly-degree-')) {
    const size = Number(command.slice(12));
    return {
      ...state,
      screen: {
        kind: 'coefficient-editor',
        problem: 'polynomial',
        size,
        values: [Array(size + 1).fill(0)],
        exactValues: [Array<Rational | null>(size + 1).fill(null)],
        expressions: [Array(size + 1).fill('')],
        row: 0,
        column: 0,
        buffer: '',
      },
    };
  }
  if (command.startsWith('inequality-')) {
    const size = Number(command.slice(11));
    return {
      ...state,
      screen: {
        kind: 'menu',
        title: 'INEQUALITY OP',
        selected: 0,
        options: [
          { key: '1', label: '<', command: `ineq-${size}-lt` },
          { key: '2', label: '<=', command: `ineq-${size}-le` },
          { key: '3', label: '>', command: `ineq-${size}-gt` },
          { key: '4', label: '>=', command: `ineq-${size}-ge` },
        ],
      },
    };
  }
  if (command.startsWith('ineq-')) {
    const [, degree, operatorCode] = command.split('-');
    const operatorMap: Record<string, InequalityOperator> = { lt: '<', le: '<=', gt: '>', ge: '>=' };
    const size = Number(degree);
    return {
      ...state,
      screen: {
        kind: 'coefficient-editor',
        problem: 'inequality',
        size,
        values: [Array(size + 1).fill(0)],
        exactValues: [Array<Rational | null>(size + 1).fill(null)],
        expressions: [Array(size + 1).fill('')],
        row: 0,
        column: 0,
        buffer: '',
        operator: operatorMap[operatorCode],
      },
    };
  }
  return { ...state, screen: { kind: 'input' } };
}

function commitEditor(state: ModeRuntime, context: RuntimeContext): ModeRuntime {
  const screen = state.screen;
  if (screen.kind === 'dimension') {
    const value = Math.max(1, Math.min(10, Math.trunc(commitNumericBuffer(screen.buffer || String(screen.rows)))));
    if (screen.target.startsWith('Mat')) {
      if (screen.stage === 'rows') {
        return { ...state, screen: { ...screen, stage: 'columns', rows: value, buffer: '' } };
      }
      const rows = screen.rows;
      const columns = value;
      return {
        ...state,
        screen: {
          kind: 'matrix-editor',
          target: screen.target as MatrixEditorScreen['target'],
          values: Array.from({ length: rows }, () => Array(columns).fill(0)),
          row: 0,
          column: 0,
          buffer: '',
        },
      };
    }
    return {
      ...state,
      screen: {
        kind: 'vector-editor',
        target: screen.target as VectorEditorScreen['target'],
        values: Array(value).fill(0),
        index: 0,
        buffer: '',
      },
    };
  }
  if (screen.kind === 'matrix-editor') {
    const values = structuredClone(screen.values);
    values[screen.row][screen.column] = commitNumericBuffer(screen.buffer);
    const isLast = screen.row === values.length - 1 && screen.column === values[0].length - 1;
    if (isLast) {
      return {
        ...state,
        memory: { ...state.memory, matrices: { ...state.memory.matrices, [screen.target]: values } },
        screen: { kind: 'message', title: screen.target, lines: [`${values.length}x${values[0].length} STORED`] },
      };
    }
    return { ...state, screen: editorMove({ ...screen, values, buffer: '' }, 'right') };
  }
  if (screen.kind === 'vector-editor') {
    const values = [...screen.values];
    values[screen.index] = commitNumericBuffer(screen.buffer);
    if (screen.index === values.length - 1) {
      return {
        ...state,
        memory: { ...state.memory, vectors: { ...state.memory.vectors, [screen.target]: values } },
        screen: { kind: 'message', title: screen.target, lines: [`${values.length}D STORED`] },
      };
    }
    return { ...state, screen: { ...screen, values, index: screen.index + 1, buffer: '' } };
  }
  if (screen.kind === 'statistics-editor') {
    const rows = structuredClone(screen.rows);
    const row = rows[screen.row];
    const value = commitNumericBuffer(screen.buffer);
    if (screen.column === 0) row.x = value;
    if (screen.column === 1 && state.memory.statistics.kind === 'double') row.y = value;
    if (screen.column === (state.memory.statistics.kind === 'double' ? 2 : 1)) row.freq = Math.max(1, Math.trunc(value));
    const columns = (state.memory.statistics.kind === 'double' ? 2 : 1) + (state.memory.statistics.frequencyEnabled ? 1 : 0);
    let nextRow = screen.row;
    let nextColumn = screen.column + 1;
    if (nextColumn >= columns) {
      nextColumn = 0;
      nextRow++;
      if (nextRow >= rows.length && rows.length < 1000) rows.push({ x: 0, y: state.memory.statistics.kind === 'double' ? 0 : undefined, freq: 1 });
    }
    return {
      ...state,
      memory: { ...state.memory, statistics: { ...state.memory.statistics, rows } },
      screen: { ...screen, rows, row: Math.min(nextRow, rows.length - 1), column: nextColumn, buffer: '' },
    };
  }
  if (screen.kind === 'function-editor') {
    return {
      ...state,
      memory: { ...state.memory, functions: { ...state.memory.functions, [screen.target]: screen.buffer } },
      screen: { kind: 'input' },
    };
  }
  if (screen.kind === 'range-editor') {
    const values = [...screen.values] as [number, number, number];
    values[screen.index] = commitNumericBuffer(screen.buffer || String(values[screen.index]));
    if (screen.index < 2) return { ...state, screen: { ...screen, values, index: screen.index + 1, buffer: '' } };
    return {
      ...state,
      memory: { ...state.memory, functions: { ...state.memory.functions, start: values[0], end: values[1], step: values[2] } },
      screen: { kind: 'input' },
    };
  }
  if (screen.kind === 'coefficient-editor') {
    try {
      const values = structuredClone(screen.values);
      const exactValues = structuredClone(screen.exactValues);
      const expressions = structuredClone(screen.expressions);
      const evaluated = evaluateCoefficientBuffer(screen.buffer, context);
      values[screen.row][screen.column] = evaluated.value;
      exactValues[screen.row][screen.column] = evaluated.exact;
      expressions[screen.row][screen.column] = screen.buffer.trim() || '0';
      const isLast = screen.row === values.length - 1 && screen.column === values[0].length - 1;
      if (!isLast) {
        return {
          ...state,
          result: String(values[screen.row][screen.column]),
          screen: editorMove({ ...screen, values, exactValues, expressions, buffer: '' }, 'right'),
        };
      }
      let entries: RuntimeSolutionEntry[];
      if (screen.problem === 'linear') {
        const exactRows = exactValues.every(row => row.every(value => value !== null));
        if (exactRows) {
          const exactResult = solveLinearSystemExact(
            exactValues.map(row => row.slice(0, screen.size) as Rational[]),
            exactValues.map(row => row[screen.size] as Rational),
          );
          entries = exactResult.status === 'unique'
            ? exactResult.values.map((value, index) => ({
              label: `X${index + 1}=`,
              exact: exactRational(value),
              decimal: exactValueDecimal(exactRational(value)),
            }))
            : [{ label: '', decimal: exactResult.status === 'none' ? 'NO SOLUTION' : 'INFINITE SOL' }];
        } else {
          const result = solveLinearSystem(values.map(row => row.slice(0, screen.size)), values.map(row => row[screen.size]));
          entries = result.status === 'unique'
            ? result.values.map((value, index) => ({ label: `X${index + 1}=`, decimal: String(value) }))
            : [{ label: '', decimal: result.status === 'none' ? 'NO SOLUTION' : 'INFINITE SOL' }];
        }
      } else if (screen.problem === 'polynomial') {
        const exactCoefficients = exactValues[0].every(value => value !== null);
        if (screen.size === 2 && exactCoefficients) {
          entries = quadraticExactRoots(exactValues[0] as [Rational, Rational, Rational]).map((value, index) => ({
            label: `X${index + 1}=`,
            exact: value,
            decimal: exactValueDecimal(value),
          }));
        } else {
          entries = solvePolynomial(values[0]).map((value, index) => ({ label: `X${index + 1}=`, decimal: formatComplex(value) }));
        }
      } else {
        entries = [{ label: '', decimal: solvePolynomialInequality(values[0], screen.operator ?? '>=') }];
      }
      return {
        ...state,
        screen: {
          kind: 'solutions',
          entries,
          selected: 0,
          showDecimal: context.resultMode === 'decimal',
          decimalEntries: entries.map(() => context.resultMode === 'decimal'),
        },
      };
    } catch (error) {
      return {
        ...state,
        result: error instanceof Error ? error.message : 'Math ERROR',
        evaluated: false,
        screen,
      };
    }
  }
  return executeModeEvaluation(state, context);
}

export function dispatchModeRuntime(
  state: ModeRuntime,
  action: RuntimeAction,
  context: RuntimeContext,
): ModeRuntime {
  let next = cloneRuntime(state);
  if (action.type === 'toggle-result' && next.screen.kind === 'solutions') {
    const entry = next.screen.entries?.[next.screen.selected];
    if (entry?.exact) {
      const defaultDecimal = next.screen.showDecimal ?? false;
      next.screen.decimalEntries ??= next.screen.entries?.map(() => defaultDecimal);
      next.screen.decimalEntries![next.screen.selected] = !next.screen.decimalEntries![next.screen.selected];
    }
    return next;
  }
  if (action.type === 'select-mode') {
    const opensMenu = ['Statistics', 'Function Table', 'Equation', 'Inequality'].includes(action.mode);
    return { ...next, mode: action.mode, input: '', result: action.mode, evaluated: false, screen: opensMenu ? optionScreen(action.mode) : { kind: 'input' } };
  }
  if (action.type === 'optn') return { ...next, screen: optionScreen(next.mode) };
  if (action.type === 'eng') {
    if (next.mode === 'Complex') return { ...next, input: next.input + 'i', screen: { kind: 'input' } };
    return next;
  }
  if (action.type === 'base') {
    next.memory.base = action.base;
    if (next.evaluated && next.lastEvaluation?.numeric !== undefined) {
      next.result = action.base === 10
        ? String(next.lastEvaluation.numeric)
        : (next.lastEvaluation.numeric >>> 0).toString(action.base).toUpperCase();
    }
    return next;
  }
  if (action.type === 'clear') {
    if (next.screen.kind !== 'input') return { ...next, screen: { kind: 'input' } };
    return { ...next, input: '', result: '0', evaluated: false, lastEvaluation: undefined };
  }
  if (action.type === 'delete') {
    if ('buffer' in next.screen) return { ...next, screen: { ...next.screen, buffer: next.screen.buffer.slice(0, -1) } as RuntimeScreen };
    return { ...next, input: next.input.slice(0, -1), evaluated: false };
  }
  if (action.type === 'append') {
    if (next.screen.kind === 'menu' && /^\d$/.test(action.value)) {
      const option = next.screen.options.find(item => item.key === action.value);
      return option ? executeOption(next, option, context) : next;
    }
    if ('buffer' in next.screen) {
      const buffer = next.screen.kind === 'coefficient-editor'
        ? appendCoefficientInput(next.screen.buffer, action.value)
        : next.screen.buffer + action.value;
      return { ...next, screen: { ...next.screen, buffer } as RuntimeScreen };
    }
    if (next.mode === 'Base-N' && next.screen.kind === 'input' && /^[0-9A-F]$/i.test(action.value)) {
      const numeric = Number.parseInt(action.value, 16);
      if (numeric >= next.memory.base) return { ...next, result: 'Syntax ERROR' };
    }
    return { ...next, input: next.input + action.value, evaluated: false, screen: { kind: 'input' } };
  }
  if (action.type === 'evaluate') {
    if (next.screen.kind === 'menu') {
      const option = next.screen.options[next.screen.selected];
      return option ? executeOption(next, option, context) : next;
    }
    if (next.screen.kind === 'message') return { ...next, screen: { kind: 'input' } };
    if (next.screen.kind === 'solutions') return next;
    return commitEditor(next, context);
  }
  if (action.type === 'up' || action.type === 'down' || action.type === 'left' || action.type === 'right') {
    if (next.screen.kind === 'menu') {
      next.screen = menuMove(next.screen, action.type);
      return next;
    }
    if (next.screen.kind === 'matrix-editor' || next.screen.kind === 'coefficient-editor') {
      next.screen = editorMove(next.screen, action.type);
      return next;
    }
    if (next.screen.kind === 'vector-editor') {
      const delta = action.type === 'left' || action.type === 'up' ? -1 : 1;
      next.screen.index = Math.max(0, Math.min(next.screen.values.length - 1, next.screen.index + delta));
      next.screen.buffer = '';
      return next;
    }
    if (next.screen.kind === 'statistics-editor') {
      const columns = (next.memory.statistics.kind === 'double' ? 2 : 1) + (next.memory.statistics.frequencyEnabled ? 1 : 0);
      if (action.type === 'left') next.screen.column = Math.max(0, next.screen.column - 1);
      if (action.type === 'right') next.screen.column = Math.min(columns - 1, next.screen.column + 1);
      if (action.type === 'up') next.screen.row = Math.max(0, next.screen.row - 1);
      if (action.type === 'down') next.screen.row = Math.min(next.screen.rows.length - 1, next.screen.row + 1);
      next.screen.buffer = '';
      return next;
    }
    if (next.screen.kind === 'table') {
      const delta = action.type === 'up' || action.type === 'left' ? -1 : 1;
      next.screen.page = Math.max(0, Math.min(Math.ceil(next.screen.rows.length / 4) - 1, next.screen.page + delta));
      return next;
    }
    if (next.screen.kind === 'solutions') {
      const delta = action.type === 'up' || action.type === 'left' ? -1 : 1;
      const length = next.screen.entries?.length ?? next.screen.lines?.length ?? 1;
      next.screen.selected = Math.max(0, Math.min(length - 1, next.screen.selected + delta));
      return next;
    }
  }
  return next;
}

export function runtimeScreenView(state: ModeRuntime) {
  const screen = state.screen;
  if (screen.kind === 'input') return undefined;
  if (screen.kind === 'menu') {
    const start = Math.floor(screen.selected / 5) * 5;
    const visible = screen.options.slice(start, start + 5);
    return {
      title: screen.title,
      lines: visible.map((item, index) => `${item.key} ${item.label}${start + index === screen.selected ? ' <' : ''}`),
      selectedIndex: screen.selected - start,
    };
  }
  if (screen.kind === 'dimension') {
    return {
      title: screen.target,
      lines: [
        screen.stage === 'rows' ? `ROWS=${screen.buffer || screen.rows}` : '',
        screen.stage === 'columns' ? `COLS=${screen.buffer || screen.columns}` : '',
        screen.stage === 'size' ? `SIZE=${screen.buffer || screen.rows}` : '',
        '1-10 THEN =',
      ].filter(Boolean),
    };
  }
  if (screen.kind === 'matrix-editor') {
    const startRow = Math.max(0, Math.min(screen.values.length - 3, screen.row - 1));
    return {
      title: `${screen.target} ${screen.values.length}x${screen.values[0].length}`,
      table: screen.values.slice(startRow, startRow + 3).map((row, rowOffset) =>
        row.slice(Math.max(0, screen.column - 1), screen.column + 3).map((value, columnOffset) => {
          const actualRow = startRow + rowOffset;
          const actualColumn = Math.max(0, screen.column - 1) + columnOffset;
          return actualRow === screen.row && actualColumn === screen.column ? `[${screen.buffer || value}]` : String(value);
        })),
    };
  }
  if (screen.kind === 'vector-editor') {
    return {
      title: `${screen.target} ${screen.values.length}D`,
      lines: screen.values.slice(Math.max(0, screen.index - 2), screen.index + 3).map((value, index) => {
        const actual = Math.max(0, screen.index - 2) + index;
        return `${actual + 1}: ${actual === screen.index ? `[${screen.buffer || value}]` : value}`;
      }),
    };
  }
  if (screen.kind === 'statistics-editor') {
    const columns = state.memory.statistics.kind === 'double'
      ? state.memory.statistics.frequencyEnabled ? ['X', 'Y', 'F'] : ['X', 'Y']
      : state.memory.statistics.frequencyEnabled ? ['X', 'F'] : ['X'];
    const start = Math.max(0, screen.row - 2);
    const table = [columns, ...screen.rows.slice(start, start + 4).map((row, rowOffset) =>
      columns.map((column, columnIndex) => {
        const value = column === 'X' ? row.x : column === 'Y' ? row.y ?? 0 : row.freq ?? 1;
        return start + rowOffset === screen.row && columnIndex === screen.column ? `[${screen.buffer || value}]` : String(value);
      }))];
    return { title: 'STAT EDIT', table };
  }
  if (screen.kind === 'function-editor') return { title: `${screen.target}(X)=`, lines: [screen.buffer || '0', 'PRESS = TO SAVE'] };
  if (screen.kind === 'range-editor') {
    const labels = ['START', 'END', 'STEP'];
    return { title: 'TABLE RANGE', lines: labels.map((label, index) => `${label}=${index === screen.index ? `[${screen.buffer || screen.values[index]}]` : screen.values[index]}`) };
  }
  if (screen.kind === 'coefficient-editor') {
    return {
      title: screen.problem.toUpperCase(),
      table: screen.values.slice(Math.max(0, screen.row - 2), screen.row + 3).map((row, rowOffset) =>
        row.slice(Math.max(0, screen.column - 2), screen.column + 3).map((value, columnOffset) => {
          const actualRow = Math.max(0, screen.row - 2) + rowOffset;
          const actualColumn = Math.max(0, screen.column - 2) + columnOffset;
          const saved = screen.expressions[actualRow]?.[actualColumn];
          return actualRow === screen.row && actualColumn === screen.column ? `[${screen.buffer || saved || value}]` : (saved || String(value));
        })),
    };
  }
  if (screen.kind === 'table') {
    const start = screen.page * 4;
    return {
      title: `TABLE ${screen.page + 1}`,
      table: [['X', 'F', 'G'], ...screen.rows.slice(start, start + 4).map(row => [
        String(row.x),
        String(row.f ?? ''),
        String(row.g ?? ''),
      ])],
    };
  }
  if (screen.kind === 'graph') return { title: 'FUNCTION GRAPH', graph: screen.rows };
  if (screen.kind === 'solutions') {
    if (!screen.entries) {
      const start = Math.floor(screen.selected / 5) * 5;
      return {
        title: 'SOLUTION',
        lines: screen.lines?.slice(start, start + 5) ?? [],
        selectedIndex: screen.selected - start,
      };
    }
    const start = Math.floor(screen.selected / 3) * 3;
    const visible = screen.entries.slice(start, start + 3);
    return {
      title: 'SOLUTION',
      formulaLines: visible.map((entry, index) => ({
        label: entry.label,
        document: !(screen.decimalEntries?.[start + index] ?? screen.showDecimal) && entry.exact ? exactValueToFormulaDocument(entry.exact) : undefined,
        text: (screen.decimalEntries?.[start + index] ?? screen.showDecimal) || !entry.exact ? entry.decimal : undefined,
      })),
      selectedIndex: screen.selected - start,
    };
  }
  return { title: screen.title, lines: screen.lines };
}
