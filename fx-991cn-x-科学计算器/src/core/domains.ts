import {
  abs,
  add,
  complex,
  conj,
  det,
  divide,
  inv,
  matrix,
  multiply,
  pow,
  subtract,
  transpose as mathTranspose,
  evaluate as mathEvaluate,
  type Complex,
} from 'mathjs';
import { evaluateExpression, formatCasioValue, type AngleMode } from './calculator';

export type RealValue = { kind: 'real'; value: number };
export type ComplexValue = { kind: 'complex'; re: number; im: number };
export type BaseIntegerValue = { kind: 'base'; value: number; base: BaseRadix };
export type MatrixValue = { kind: 'matrix'; values: number[][] };
export type VectorValue = { kind: 'vector'; values: number[] };
export type StatisticsValue = {
  kind: 'statistics';
  rows: StatisticsRow[];
  frequencyEnabled: boolean;
};
export type SolutionSetValue = {
  kind: 'solutions';
  values: Array<number | ComplexValue>;
  labels?: string[];
};
export type CalcValue =
  | RealValue
  | ComplexValue
  | BaseIntegerValue
  | MatrixValue
  | VectorValue
  | StatisticsValue
  | SolutionSetValue;

export type BaseRadix = 2 | 8 | 10 | 16;
export type BaseOperator = 'and' | 'or' | 'xor' | 'xnor';
export type StatisticsRow = { x: number; y?: number; freq?: number };
export type RegressionType =
  | 'linear'
  | 'quadratic'
  | 'logarithmic'
  | 'exp-e'
  | 'exp-ab'
  | 'power'
  | 'inverse';

export type RegressionResult = {
  type: RegressionType;
  a: number;
  b: number;
  c?: number;
  r?: number;
  predict: (x: number) => number;
};

export type InequalityOperator = '<' | '<=' | '>' | '>=';

const EPSILON = 1e-10;
const UINT32 = 0x1_0000_0000;

function toComplexValue(value: number | Complex): ComplexValue {
  if (typeof value === 'number') return { kind: 'complex', re: value, im: 0 };
  return { kind: 'complex', re: value.re, im: value.im };
}

function asMathComplex(value: ComplexValue): Complex {
  return complex(value.re, value.im);
}

export function complexFromPolar(
  radius: number,
  theta: number,
  angleMode: AngleMode,
): ComplexValue {
  const radians = angleMode === 'RAD'
    ? theta
    : angleMode === 'GRAD'
      ? theta * Math.PI / 200
      : theta * Math.PI / 180;
  return {
    kind: 'complex',
    re: radius * Math.cos(radians),
    im: radius * Math.sin(radians),
  };
}

export function complexToPolar(
  value: ComplexValue,
  angleMode: AngleMode,
): { radius: number; theta: number } {
  const radius = Math.hypot(value.re, value.im);
  const radians = Math.atan2(value.im, value.re);
  const theta = angleMode === 'RAD'
    ? radians
    : angleMode === 'GRAD'
      ? radians * 200 / Math.PI
      : radians * 180 / Math.PI;
  return { radius, theta };
}

export function complexBinary(
  left: ComplexValue,
  right: ComplexValue,
  operator: '+' | '-' | '*' | '/' | '^',
): ComplexValue {
  const a = asMathComplex(left);
  const b = asMathComplex(right);
  if (operator === '+') return toComplexValue(add(a, b) as Complex);
  if (operator === '-') return toComplexValue(subtract(a, b) as Complex);
  if (operator === '*') return toComplexValue(multiply(a, b) as Complex);
  if (operator === '/') return toComplexValue(divide(a, b) as Complex);
  return toComplexValue(pow(a, b) as Complex);
}

export function complexConjugate(value: ComplexValue): ComplexValue {
  return toComplexValue(conj(asMathComplex(value)) as Complex);
}

export function complexArgument(value: ComplexValue, angleMode: AngleMode): number {
  return complexToPolar(value, angleMode).theta;
}

export function complexReal(value: ComplexValue): number {
  return value.re;
}

export function complexImag(value: ComplexValue): number {
  return value.im;
}

export function complexAbs(value: ComplexValue): number {
  return Number(abs(asMathComplex(value)));
}

export function formatComplex(value: ComplexValue): string {
  const real = Math.abs(value.re) < EPSILON ? 0 : value.re;
  const imaginary = Math.abs(value.im) < EPSILON ? 0 : value.im;
  if (imaginary === 0) return formatCasioValue(real);
  if (real === 0) return `${formatCasioValue(imaginary)}i`;
  const sign = imaginary < 0 ? '-' : '+';
  return `${formatCasioValue(real)}${sign}${formatCasioValue(Math.abs(imaginary))}i`;
}


function normalizeTopLevelPolar(input: string): string {
  let depth = 0;
  for (let index = 0; index < input.length; index++) {
    if (input[index] === '(') depth++;
    else if (input[index] === ')') depth--;
    else if (input[index] === '∠' && depth === 0) {
      const radius = input.slice(0, index).trim();
      const theta = input.slice(index + 1).trim();
      if (!radius || !theta) throw new Error('Syntax ERROR');
      return `polar((${radius}),(${theta}))`;
    }
  }
  return input;
}

export function evaluateComplexExpression(
  input: string,
  angleMode: AngleMode,
  variables: Record<string, number> = {},
): ComplexValue {
  const normalized = normalizeTopLevelPolar(input)
    .replaceAll('×', '*')
    .replaceAll('÷', '/')
    .replaceAll('−', '-')
    .replaceAll('²', '^2')
    .replaceAll('³', '^3')
    .replaceAll('⁻¹', '^(-1)')
    .replaceAll('√', 'sqrt')
    .replaceAll('π', 'pi')
    .replaceAll('sin⁻¹', 'asin')
    .replaceAll('cos⁻¹', 'acos')
    .replaceAll('tan⁻¹', 'atan');
  const scope = {
    ...variables,
    i: complex(0, 1),
    polar: (radius: number, theta: number) => {
      const value = complexFromPolar(radius, theta, angleMode);
      return complex(value.re, value.im);
    },
    Rec: (radius: number, theta: number) => {
      const value = complexFromPolar(radius, theta, angleMode);
      return complex(value.re, value.im);
    },
    Conjg: (value: number | Complex) => conj(value),
    arg: (value: number | Complex) => {
      const complexValue = toComplexValue(value);
      return complexArgument(complexValue, angleMode);
    },
    Rep: (value: number | Complex) => toComplexValue(value).re,
    Imp: (value: number | Complex) => toComplexValue(value).im,
    Abs: (value: number | Complex) => Number(abs(value)),
  };
  const value = mathEvaluate(normalized, scope) as number | Complex;
  return toComplexValue(value);
}
export function assertInt32(value: number): number {
  if (!Number.isInteger(value) || value < -0x8000_0000 || value > 0x7fff_ffff) {
    throw new Error('Math ERROR');
  }
  return value | 0;
}

export function parseBaseInteger(input: string, base: BaseRadix): number {
  const text = input.trim().toUpperCase();
  if (!text) throw new Error('Syntax ERROR');
  const patterns: Record<BaseRadix, RegExp> = {
    2: /^[01]+$/,
    8: /^[0-7]+$/,
    10: /^[0-9]+$/,
    16: /^[0-9A-F]+$/,
  };
  if (!patterns[base].test(text)) throw new Error('Syntax ERROR');
  const unsigned = Number.parseInt(text, base);
  if (!Number.isFinite(unsigned) || unsigned < 0 || unsigned >= UINT32) {
    throw new Error('Math ERROR');
  }
  const normalized = unsigned >>> 0;
  return normalized > 0x7fff_ffff ? normalized - UINT32 : normalized;
}

export function formatBaseInteger(value: number, base: BaseRadix): string {
  const int32 = assertInt32(value);
  if (base === 10) return String(int32);
  if (base === 2) return (int32 >>> 0).toString(2).padStart(32, '0');
  const digits = base === 8 ? 11 : 8;
  return (int32 >>> 0).toString(base).toUpperCase().padStart(digits, '0');
}

export function baseUnary(value: number, operator: 'neg' | 'not'): number {
  const int32 = assertInt32(value);
  return operator === 'neg' ? assertInt32(-int32) : ~int32;
}

export function baseBinary(left: number, right: number, operator: BaseOperator): number {
  const a = assertInt32(left);
  const b = assertInt32(right);
  if (operator === 'and') return a & b;
  if (operator === 'or') return a | b;
  if (operator === 'xor') return a ^ b;
  return ~(a ^ b);
}


type BaseToken =
  | { type: 'number'; value: number }
  | { type: 'operator'; value: string }
  | { type: 'paren'; value: '(' | ')' };

export function evaluateBaseExpression(input: string, defaultBase: BaseRadix): number {
  const tokens: BaseToken[] = [];
  const normalized = input.trim().toUpperCase();
  let index = 0;
  while (index < normalized.length) {
    const char = normalized[index];
    if (/\s/.test(char)) { index++; continue; }
    if (char === '(' || char === ')') { tokens.push({ type: 'paren', value: char }); index++; continue; }
    const operator = normalized.slice(index).match(/^(XNOR|XOR|AND|OR|NEG|NOT|\+|-|\*|\/)/);
    if (operator) { tokens.push({ type: 'operator', value: operator[0].toLowerCase() }); index += operator[0].length; continue; }
    const prefixed = normalized.slice(index).match(/^([DBHO])([0-9A-F]+)/);
    if (prefixed) {
      const baseMap: Record<string, BaseRadix> = { D: 10, B: 2, H: 16, O: 8 };
      tokens.push({ type: 'number', value: parseBaseInteger(prefixed[2], baseMap[prefixed[1]]) });
      index += prefixed[0].length;
      continue;
    }
    const number = normalized.slice(index).match(/^[0-9A-F]+/);
    if (number) { tokens.push({ type: 'number', value: parseBaseInteger(number[0], defaultBase) }); index += number[0].length; continue; }
    throw new Error('Syntax ERROR');
  }
  let position = 0;
  const peek = () => tokens[position];
  const consume = () => tokens[position++];
  const parsePrimary = (): number => {
    const token = consume();
    if (!token) throw new Error('Syntax ERROR');
    if (token.type === 'number') return token.value;
    if (token.type === 'operator' && (token.value === 'neg' || token.value === 'not')) return baseUnary(parsePrimary(), token.value);
    if (token.type === 'paren' && token.value === '(') {
      const value = parseOr();
      const close = consume();
      if (close?.type !== 'paren' || close.value !== ')') throw new Error('Syntax ERROR');
      return value;
    }
    throw new Error('Syntax ERROR');
  };
  const parseMul = (): number => {
    let value = parsePrimary();
    while (peek()?.type === 'operator' && ['*', '/'].includes(String(peek()?.value))) {
      const operator = String(consume().value);
      const right = parsePrimary();
      value = assertInt32(operator === '*' ? Math.imul(value, right) : Math.trunc(value / right));
    }
    return value;
  };
  const parseAdd = (): number => {
    let value = parseMul();
    while (peek()?.type === 'operator' && ['+', '-'].includes(String(peek()?.value))) {
      const operator = String(consume().value);
      const right = parseMul();
      value = assertInt32(operator === '+' ? value + right : value - right);
    }
    return value;
  };
  const parseAnd = (): number => {
    let value = parseAdd();
    while (peek()?.type === 'operator' && peek().value === 'and') { consume(); value = baseBinary(value, parseAdd(), 'and'); }
    return value;
  };
  const parseOr = (): number => {
    let value = parseAnd();
    while (peek()?.type === 'operator' && ['or', 'xor', 'xnor'].includes(String(peek()?.value))) {
      const operator = String(consume().value) as BaseOperator;
      value = baseBinary(value, parseAnd(), operator);
    }
    return value;
  };
  const result = parseOr();
  if (position !== tokens.length) throw new Error('Syntax ERROR');
  return assertInt32(result);
}
function assertMatrix(values: number[][]): void {
  if (!values.length || values.length > 4) throw new Error('Dimension ERROR');
  const columns = values[0]?.length ?? 0;
  if (!columns || columns > 4 || values.some(row => row.length !== columns)) {
    throw new Error('Dimension ERROR');
  }
}

export function matrixAdd(left: number[][], right: number[][]): number[][] {
  assertMatrix(left);
  assertMatrix(right);
  if (left.length !== right.length || left[0].length !== right[0].length) {
    throw new Error('Dimension ERROR');
  }
  return left.map((row, i) => row.map((value, j) => value + right[i][j]));
}

export function matrixSubtract(left: number[][], right: number[][]): number[][] {
  assertMatrix(left);
  assertMatrix(right);
  if (left.length !== right.length || left[0].length !== right[0].length) {
    throw new Error('Dimension ERROR');
  }
  return left.map((row, i) => row.map((value, j) => value - right[i][j]));
}

export function matrixMultiply(left: number[][], right: number[][]): number[][] {
  assertMatrix(left);
  assertMatrix(right);
  if (left[0].length !== right.length) throw new Error('Dimension ERROR');
  return left.map(row => right[0].map((_, column) =>
    row.reduce((sum, value, index) => sum + value * right[index][column], 0)));
}

export function matrixScale(values: number[][], scalar: number): number[][] {
  assertMatrix(values);
  return values.map(row => row.map(value => value * scalar));
}

export function matrixDeterminant(values: number[][]): number {
  assertMatrix(values);
  if (values.length !== values[0].length) throw new Error('Dimension ERROR');
  return Number(det(matrix(values)));
}

export function matrixTranspose(values: number[][]): number[][] {
  assertMatrix(values);
  return (mathTranspose(matrix(values)).toArray() as number[][]);
}

export function matrixInverse(values: number[][]): number[][] {
  assertMatrix(values);
  if (values.length !== values[0].length) throw new Error('Dimension ERROR');
  if (Math.abs(matrixDeterminant(values)) < EPSILON) throw new Error('Math ERROR');
  return (inv(matrix(values)).toArray() as number[][]);
}

export function matrixIdentity(size: number): number[][] {
  if (!Number.isInteger(size) || size < 1 || size > 4) throw new Error('Argument ERROR');
  return Array.from({ length: size }, (_, row) =>
    Array.from({ length: size }, (_, column) => row === column ? 1 : 0));
}

export function matrixPower(values: number[][], exponent: number): number[][] {
  assertMatrix(values);
  if (!Number.isInteger(exponent)) throw new Error('Argument ERROR');
  if (values.length !== values[0].length) throw new Error('Dimension ERROR');
  if (exponent === 0) return matrixIdentity(values.length);
  if (exponent < 0) return matrixPower(matrixInverse(values), -exponent);
  let result = matrixIdentity(values.length);
  let factor = values;
  let powerValue = exponent;
  while (powerValue > 0) {
    if (powerValue & 1) result = matrixMultiply(result, factor);
    factor = matrixMultiply(factor, factor);
    powerValue >>= 1;
  }
  return result;
}

export function matrixElementAbs(values: number[][]): number[][] {
  assertMatrix(values);
  return values.map(row => row.map(value => Math.abs(value)));
}

function assertVector(values: number[]): void {
  if ((values.length !== 2 && values.length !== 3) || values.some(value => !Number.isFinite(value))) {
    throw new Error('Dimension ERROR');
  }
}

export function statisticsCapacity(
  kind: 'single' | 'double',
  frequencyEnabled: boolean,
): number {
  if (kind === 'single' && !frequencyEnabled) return 160;
  if (kind === 'double' && frequencyEnabled) return 53;
  return 80;
}

export function vectorAdd(left: number[], right: number[]): number[] {
  assertVector(left);
  assertVector(right);
  if (left.length !== right.length) throw new Error('Dimension ERROR');
  return left.map((value, index) => value + right[index]);
}

export function vectorSubtract(left: number[], right: number[]): number[] {
  assertVector(left);
  assertVector(right);
  if (left.length !== right.length) throw new Error('Dimension ERROR');
  return left.map((value, index) => value - right[index]);
}

export function vectorScale(values: number[], scalar: number): number[] {
  assertVector(values);
  return values.map(value => value * scalar);
}

export function vectorDot(left: number[], right: number[]): number {
  assertVector(left);
  assertVector(right);
  if (left.length !== right.length) throw new Error('Dimension ERROR');
  return left.reduce((sum, value, index) => sum + value * right[index], 0);
}

export function vectorNorm(values: number[]): number {
  assertVector(values);
  return Math.hypot(...values);
}

export function vectorUnit(values: number[]): number[] {
  const norm = vectorNorm(values);
  if (norm < EPSILON) throw new Error('Math ERROR');
  return values.map(value => value / norm);
}

export function vectorAngle(
  left: number[],
  right: number[],
  angleMode: AngleMode,
): number {
  const denominator = vectorNorm(left) * vectorNorm(right);
  if (denominator < EPSILON) throw new Error('Math ERROR');
  const radians = Math.acos(Math.max(-1, Math.min(1, vectorDot(left, right) / denominator)));
  if (angleMode === 'RAD') return radians;
  if (angleMode === 'GRAD') return radians * 200 / Math.PI;
  return radians * 180 / Math.PI;
}

export function vectorCross(left: number[], right: number[]): number[] {
  if (left.length !== 3 || right.length !== 3) throw new Error('Dimension ERROR');
  return [
    left[1] * right[2] - left[2] * right[1],
    left[2] * right[0] - left[0] * right[2],
    left[0] * right[1] - left[1] * right[0],
  ];
}

function expandRows(rows: StatisticsRow[]): Array<{ x: number; y?: number }> {
  if (!rows.length || rows.length > 1000) throw new Error('Range ERROR');
  const expanded: Array<{ x: number; y?: number }> = [];
  for (const row of rows) {
    const frequency = row.freq ?? 1;
    if (!Number.isInteger(frequency) || frequency < 1) throw new Error('Argument ERROR');
    for (let index = 0; index < frequency; index++) expanded.push({ x: row.x, y: row.y });
  }
  return expanded;
}

function normalCdfStandard(value: number): number {
  const sign = value < 0 ? -1 : 1;
  const x = Math.abs(value) / Math.SQRT2;
  const t = 1 / (1 + 0.3275911 * x);
  const polynomial = (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t
    - 0.284496736) * t + 0.254829592) * t;
  const erf = sign * (1 - polynomial * Math.exp(-x * x));
  return 0.5 * (1 + erf);
}

export function normalProbability(
  operation: 'P' | 'Q' | 'R',
  t: number,
): number {
  if (!Number.isFinite(t)) throw new Error('Argument ERROR');
  const cumulative = normalCdfStandard(t);
  if (operation === 'P') return cumulative;
  if (operation === 'Q') return cumulative - 0.5;
  return 1 - cumulative;
}

export function standardizedVariable(rows: StatisticsRow[], x: number): number {
  if (!Number.isFinite(x)) throw new Error('Argument ERROR');
  const statistics = singleVariableStatistics(rows);
  if (!Number.isFinite(statistics.populationSd) || statistics.populationSd < EPSILON) {
    throw new Error('Math ERROR');
  }
  return (x - statistics.mean) / statistics.populationSd;
}

function quantile(sorted: number[], position: number): number {
  if (!sorted.length) throw new Error('Math ERROR');
  const index = (sorted.length - 1) * position;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
}

export function singleVariableStatistics(rows: StatisticsRow[]) {
  const values = expandRows(rows).map(row => row.x);
  const n = values.length;
  const sum = values.reduce((total, value) => total + value, 0);
  const sumSquares = values.reduce((total, value) => total + value * value, 0);
  const mean = sum / n;
  const populationVariance = values.reduce((total, value) => total + (value - mean) ** 2, 0) / n;
  const sampleVariance = n > 1
    ? values.reduce((total, value) => total + (value - mean) ** 2, 0) / (n - 1)
    : NaN;
  const sorted = [...values].sort((a, b) => a - b);
  return {
    n,
    sum,
    sumSquares,
    mean,
    populationVariance,
    populationSd: Math.sqrt(populationVariance),
    sampleVariance,
    sampleSd: Math.sqrt(sampleVariance),
    min: sorted[0],
    q1: quantile(sorted, 0.25),
    median: quantile(sorted, 0.5),
    q3: quantile(sorted, 0.75),
    max: sorted[sorted.length - 1],
  };
}

export function doubleVariableStatistics(rows: StatisticsRow[]) {
  const values = expandRows(rows);
  if (values.some(row => row.y === undefined)) throw new Error('Argument ERROR');
  const x = values.map(row => row.x);
  const y = values.map(row => row.y as number);
  const n = x.length;
  const sumX = x.reduce((total, value) => total + value, 0);
  const sumY = y.reduce((total, value) => total + value, 0);
  const sumXX = x.reduce((total, value) => total + value * value, 0);
  const sumYY = y.reduce((total, value) => total + value * value, 0);
  const sumXY = x.reduce((total, value, index) => total + value * y[index], 0);
  const meanX = sumX / n;
  const meanY = sumY / n;
  const covariance = sumXY - n * meanX * meanY;
  const varianceX = sumXX - n * meanX * meanX;
  const varianceY = sumYY - n * meanY * meanY;
  const sumXXX = x.reduce((total, value) => total + value ** 3, 0);
  const sumXXY = x.reduce((total, value, index) => total + value * value * y[index], 0);
  const sumXXXX = x.reduce((total, value) => total + value ** 4, 0);
  return {
    n,
    sumX,
    sumY,
    sumXX,
    sumYY,
    sumXY,
    sumXXX,
    sumXXY,
    sumXXXX,
    meanX,
    meanY,
    populationSdX: Math.sqrt(varianceX / n),
    populationSdY: Math.sqrt(varianceY / n),
    sampleSdX: Math.sqrt(varianceX / (n - 1)),
    sampleSdY: Math.sqrt(varianceY / (n - 1)),
    r: covariance / Math.sqrt(varianceX * varianceY),
  };
}

function solveNormalEquations(features: number[][], targets: number[]): number[] {
  const columns = features[0].length;
  const normal = Array.from({ length: columns }, () => Array(columns).fill(0));
  const rhs = Array(columns).fill(0);
  for (let row = 0; row < features.length; row++) {
    for (let i = 0; i < columns; i++) {
      rhs[i] += features[row][i] * targets[row];
      for (let j = 0; j < columns; j++) normal[i][j] += features[row][i] * features[row][j];
    }
  }
  return solveLinearSystem(normal, rhs).values;
}

export function regression(rows: StatisticsRow[], type: RegressionType): RegressionResult {
  const values = expandRows(rows);
  if (values.some(row => row.y === undefined)) throw new Error('Argument ERROR');
  const x = values.map(row => row.x);
  const y = values.map(row => row.y as number);
  if (type === 'quadratic') {
    const [c, b, a] = solveNormalEquations(x.map(value => [1, value, value * value]), y);
    return { type, a, b, c, predict: value => a * value * value + b * value + c };
  }

  let transformedX = x;
  let transformedY = y;
  if (type === 'logarithmic') {
    if (x.some(value => value <= 0)) throw new Error('Math ERROR');
    transformedX = x.map(Math.log);
  }
  if (type === 'exp-e' || type === 'exp-ab') {
    if (y.some(value => value <= 0)) throw new Error('Math ERROR');
    transformedY = y.map(Math.log);
  }
  if (type === 'power') {
    if (x.some(value => value <= 0) || y.some(value => value <= 0)) throw new Error('Math ERROR');
    transformedX = x.map(Math.log);
    transformedY = y.map(Math.log);
  }
  if (type === 'inverse') {
    if (x.some(value => Math.abs(value) < EPSILON)) throw new Error('Math ERROR');
    transformedX = x.map(value => 1 / value);
  }

  const stats = doubleVariableStatistics(transformedX.map((value, index) => ({
    x: value,
    y: transformedY[index],
  })));
  const varianceX = transformedX.reduce((total, value) => total + (value - stats.meanX) ** 2, 0);
  const covariance = transformedX.reduce(
    (total, value, index) => total + (value - stats.meanX) * (transformedY[index] - stats.meanY),
    0,
  );
  const slope = covariance / varianceX;
  const intercept = stats.meanY - slope * stats.meanX;

  if (type === 'exp-e') {
    const a = Math.exp(intercept);
    return { type, a, b: slope, r: stats.r, predict: value => a * Math.exp(slope * value) };
  }
  if (type === 'exp-ab') {
    const a = Math.exp(intercept);
    const b = Math.exp(slope);
    return { type, a, b, r: stats.r, predict: value => a * b ** value };
  }
  if (type === 'power') {
    const a = Math.exp(intercept);
    return { type, a, b: slope, r: stats.r, predict: value => a * value ** slope };
  }
  if (type === 'logarithmic') {
    return { type, a: intercept, b: slope, r: stats.r, predict: value => intercept + slope * Math.log(value) };
  }
  if (type === 'inverse') {
    return { type, a: intercept, b: slope, r: stats.r, predict: value => intercept + slope / value };
  }
  return { type, a: slope, b: intercept, r: stats.r, predict: value => slope * value + intercept };
}

export function generateFunctionTable(
  fExpression: string,
  gExpression: string,
  start: number,
  end: number,
  step: number,
  variables: Record<string, number>,
  angleMode: AngleMode,
) {
  if (!Number.isFinite(step) || step === 0 || (end - start) / step < 0) throw new Error('Range ERROR');
  const count = Math.floor((end - start) / step + EPSILON) + 1;
  const maximumRows = gExpression.trim() ? 30 : 45;
  if (count < 1 || count > maximumRows) throw new Error('Range ERROR');
  return Array.from({ length: count }, (_, index) => {
    const x = start + index * step;
    const evaluate = (expression: string) => {
      if (!expression.trim()) return undefined;
      const result = evaluateExpression(expression, {
        variables: { ...variables, X: x },
        ans: 0,
        angleMode,
      });
      return result.success ? result.value : NaN;
    };
    return { x, f: evaluate(fExpression), g: evaluate(gExpression) };
  });
}

export type LinearSystemResult =
  | { status: 'unique'; values: number[] }
  | { status: 'none'; values: [] }
  | { status: 'infinite'; values: [] };

export function solveLinearSystem(coefficients: number[][], constants: number[]): LinearSystemResult {
  const n = coefficients.length;
  if (n < 1 || n > 10 || constants.length !== n || coefficients.some(row => row.length !== n)) {
    throw new Error('Dimension ERROR');
  }
  const augmented = coefficients.map((row, index) => [...row, constants[index]]);
  let rank = 0;
  for (let column = 0; column < n && rank < n; column++) {
    let pivot = rank;
    for (let row = rank + 1; row < n; row++) {
      if (Math.abs(augmented[row][column]) > Math.abs(augmented[pivot][column])) pivot = row;
    }
    if (Math.abs(augmented[pivot][column]) < EPSILON) continue;
    [augmented[rank], augmented[pivot]] = [augmented[pivot], augmented[rank]];
    const divisor = augmented[rank][column];
    for (let col = column; col <= n; col++) augmented[rank][col] /= divisor;
    for (let row = 0; row < n; row++) {
      if (row === rank) continue;
      const factor = augmented[row][column];
      for (let col = column; col <= n; col++) augmented[row][col] -= factor * augmented[rank][col];
    }
    rank++;
  }
  for (const row of augmented) {
    if (row.slice(0, n).every(value => Math.abs(value) < EPSILON)
      && Math.abs(row[n]) >= EPSILON) return { status: 'none', values: [] };
  }
  if (rank < n) return { status: 'infinite', values: [] };
  return { status: 'unique', values: augmented.map(row => row[n]) };
}

function polyEval(coefficients: number[], value: ComplexValue): ComplexValue {
  let result: ComplexValue = { kind: 'complex', re: 0, im: 0 };
  for (const coefficient of coefficients) {
    result = complexBinary(
      result,
      value,
      '*',
    );
    result = complexBinary(result, { kind: 'complex', re: coefficient, im: 0 }, '+');
  }
  return result;
}

export function solvePolynomial(coefficients: number[]): ComplexValue[] {
  const normalized = [...coefficients];
  while (normalized.length > 1 && Math.abs(normalized[0]) < EPSILON) normalized.shift();
  const degree = normalized.length - 1;
  if (degree < 1 || degree > 4) throw new Error('Argument ERROR');
  const leading = normalized[0];
  const monic = normalized.map(value => value / leading);
  const radius = 1 + Math.max(...monic.slice(1).map(Math.abs));
  let roots = Array.from({ length: degree }, (_, index) => complexFromPolar(
    radius,
    2 * Math.PI * index / degree + 0.2,
    'RAD',
  ));
  for (let iteration = 0; iteration < 200; iteration++) {
    let maxDelta = 0;
    roots = roots.map((root, index) => {
      let denominator: ComplexValue = { kind: 'complex', re: 1, im: 0 };
      roots.forEach((other, otherIndex) => {
        if (index !== otherIndex) denominator = complexBinary(denominator, complexBinary(root, other, '-'), '*');
      });
      if (complexAbs(denominator) < EPSILON) denominator = { kind: 'complex', re: EPSILON, im: EPSILON };
      const delta = complexBinary(polyEval(monic, root), denominator, '/');
      maxDelta = Math.max(maxDelta, complexAbs(delta));
      return complexBinary(root, delta, '-');
    });
    if (maxDelta < 1e-12) break;
  }
  return roots
    .map(root => ({
      kind: 'complex' as const,
      re: Math.abs(root.re) < 1e-9 ? 0 : root.re,
      im: Math.abs(root.im) < 1e-9 ? 0 : root.im,
    }))
    .sort((a, b) => a.re - b.re || a.im - b.im);
}

function intervalLabel(
  left: number,
  right: number,
  leftClosed: boolean,
  rightClosed: boolean,
): string {
  const leftText = left === -Infinity ? '-INF' : formatCasioValue(left);
  const rightText = right === Infinity ? 'INF' : formatCasioValue(right);
  return `${leftClosed ? '[' : '('}${leftText},${rightText}${rightClosed ? ']' : ')'}`;
}

export function solvePolynomialInequality(
  coefficients: number[],
  operator: InequalityOperator,
): string {
  const roots = solvePolynomial(coefficients)
    .filter(root => Math.abs(root.im) < 1e-7)
    .map(root => root.re)
    .filter((root, index, list) => index === 0 || Math.abs(root - list[index - 1]) > 1e-7);
  const boundaries = [-Infinity, ...roots, Infinity];
  const intervals: string[] = [];
  for (let index = 0; index < boundaries.length - 1; index++) {
    const left = boundaries[index];
    const right = boundaries[index + 1];
    const sample = left === -Infinity
      ? right - Math.max(1, Math.abs(right))
      : right === Infinity
        ? left + Math.max(1, Math.abs(left))
        : (left + right) / 2;
    const value = coefficients.reduce((total, coefficient) => total * sample + coefficient, 0);
    const accepted = operator === '<' || operator === '<=' ? value < 0 : value > 0;
    if (accepted) intervals.push(intervalLabel(
      left,
      right,
      (operator === '<=' || operator === '>=') && Number.isFinite(left),
      (operator === '<=' || operator === '>=') && Number.isFinite(right),
    ));
  }
  if (intervals.length === 0) {
    if ((operator === '<=' || operator === '>=') && roots.length) {
      return roots.map(root => `{${formatCasioValue(root)}}`).join(' U ');
    }
    return 'NO SOLUTION';
  }
  if (intervals.length === 1 && intervals[0] === '(-INF,INF)') return 'ALL REAL';
  return intervals.join(' U ');
}
