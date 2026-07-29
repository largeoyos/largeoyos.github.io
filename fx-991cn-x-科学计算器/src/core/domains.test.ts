import assert from 'node:assert/strict';
import test from 'node:test';
import {
  baseBinary,
  baseUnary,
  complexBinary,
  complexConjugate,
  complexFromPolar,
  evaluateComplexExpression,
  formatBaseInteger,
  formatComplex,
  generateFunctionTable,
  matrixDeterminant,
  matrixIdentity,
  matrixInverse,
  matrixMultiply,
  parseBaseInteger,
  regression,
  singleVariableStatistics,
  statisticsCapacity,
  solveLinearSystem,
  solvePolynomial,
  solvePolynomialInequality,
  vectorAngle,
  vectorDot,
  vectorUnit,
} from './domains';

test('complex arithmetic and conversion follow calculator behavior', () => {
  const left = { kind: 'complex' as const, re: 1, im: 1 };
  const right = { kind: 'complex' as const, re: 1, im: -1 };
  assert.equal(formatComplex(complexBinary(left, right, '*')), '2');
  assert.equal(formatComplex(complexConjugate({ kind: 'complex', re: 2, im: 3 })), '2-3i');
  const polar = complexFromPolar(2, 45, 'DEG');
  assert.ok(Math.abs(polar.re - Math.SQRT2) < 1e-10);
  assert.equal(formatComplex(evaluateComplexExpression('Conjg(2+3i)', 'DEG')), '2-3i');
  assert.equal(formatComplex(evaluateComplexExpression('arg(1+i)', 'DEG')), '45');
  assert.equal(formatComplex(evaluateComplexExpression('Rep(2+3i)', 'DEG')), '2');
  assert.equal(formatComplex(evaluateComplexExpression('Imp(2+3i)', 'DEG')), '3');
  assert.ok(Math.abs(evaluateComplexExpression('(1+1)∠(A+5)', 'DEG', { A: 40 }).re - Math.SQRT2) < 1e-10);
});

test('base-n operations use signed 32-bit semantics', () => {
  assert.equal(formatBaseInteger(-1, 16), 'FFFFFFFF');
  assert.equal(formatBaseInteger(-1, 2), '11111111111111111111111111111111');
  assert.equal(parseBaseInteger('11111111111111111111111111111111', 2), -1);
  assert.equal(parseBaseInteger('10000000000000000000000000000000', 2), -2147483648);
  assert.throws(() => parseBaseInteger('102', 2), /Syntax ERROR/);
  assert.throws(() => parseBaseInteger('8', 8), /Syntax ERROR/);
  assert.throws(() => parseBaseInteger('A', 10), /Syntax ERROR/);
  assert.equal(baseUnary(0, 'not'), -1);
  assert.equal(baseBinary(0b1010, 0b1100, 'xor'), 0b0110);
});

test('matrix operations include determinant inverse and identity', () => {
  const values = [[2, 1], [1, 1]];
  assert.equal(matrixDeterminant(values), 1);
  assert.deepEqual(matrixMultiply(values, matrixInverse(values)).map(row => row.map(Math.round)), matrixIdentity(2));
  assert.throws(() => matrixIdentity(5), /Argument ERROR/);
});

test('vector operations include dot angle and unit vector', () => {
  assert.equal(vectorDot([1, 0], [0, 1]), 0);
  assert.equal(vectorAngle([1, 0], [0, 1], 'DEG'), 90);
  assert.deepEqual(vectorUnit([3, 4]).map(value => Number(value.toFixed(2))), [0.6, 0.8]);
  assert.throws(() => vectorDot([1], [1]), /Dimension ERROR/);
  assert.throws(() => vectorDot([1, 2, 3, 4], [1, 2, 3, 4]), /Dimension ERROR/);
});

test('statistics editor capacities match fx-991CN X memory layout', () => {
  assert.equal(statisticsCapacity('single', false), 160);
  assert.equal(statisticsCapacity('single', true), 80);
  assert.equal(statisticsCapacity('double', false), 80);
  assert.equal(statisticsCapacity('double', true), 53);
});

test('single variable statistics and linear regression', () => {
  const rows = [{ x: 1, y: 3 }, { x: 2, y: 5 }, { x: 3, y: 7 }];
  assert.equal(singleVariableStatistics(rows).mean, 2);
  const result = regression(rows, 'linear');
  assert.ok(Math.abs(result.a - 2) < 1e-10);
  assert.ok(Math.abs(result.b - 1) < 1e-10);
});

test('function table evaluates f and g', () => {
  const table = generateFunctionTable('X^2', 'X+1', 0, 2, 1, {}, 'DEG');
  assert.deepEqual(table, [
    { x: 0, f: 0, g: 1 },
    { x: 1, f: 1, g: 2 },
    { x: 2, f: 4, g: 3 },
  ]);
});

test('linear system distinguishes unique none and infinite solutions', () => {
  assert.deepEqual(solveLinearSystem([[1, 1], [1, -1]], [4, 2]), {
    status: 'unique',
    values: [3, 1],
  });
  assert.equal(solveLinearSystem([[1, 1], [2, 2]], [1, 3]).status, 'none');
  assert.equal(solveLinearSystem([[1, 1], [2, 2]], [1, 2]).status, 'infinite');
});

test('polynomial solver returns real and complex roots', () => {
  const roots = solvePolynomial([1, 0, -5, 0, 4]);
  assert.deepEqual(roots.map(root => Math.round(root.re)), [-2, -1, 1, 2]);
  const complexRoots = solvePolynomial([1, 0, 1]);
  assert.deepEqual(complexRoots.map(root => Math.round(root.im)), [-1, 1]);
});

test('polynomial inequalities produce interval notation', () => {
  assert.equal(solvePolynomialInequality([1, 0, -1], '>='), '(-INF,-1] U [1,INF)');
});

test('complex mode reuses normal-mode real expression semantics', () => {
  assert.ok(Math.abs(evaluateComplexExpression('√0.2^2+2.8^2', 'DEG').re - 2.80713376952) < 1e-11);
  assert.equal(evaluateComplexExpression('.2', 'DEG').re, 0.2);
  assert.equal(evaluateComplexExpression('200+10%', 'DEG').re, 220);
  assert.ok(Math.abs(evaluateComplexExpression('sin(30)', 'DEG').re - 0.5) < 1e-12);
  assert.ok(Math.abs(evaluateComplexExpression('sin(π/2)', 'RAD').re - 1) < 1e-12);
  assert.equal(evaluateComplexExpression('root(3,-8)', 'DEG').re, -2);
  assert.equal(evaluateComplexExpression('f(3)', 'DEG', {}, 0, { definedFunctions: { f: 'X^2+1' } }).re, 10);
  assert.ok(Math.abs(evaluateComplexExpression('f(i)', 'DEG', {}, 0, { definedFunctions: { f: 'X^2+1' } }).re) < 1e-12);
});

test('complex-only domains and nested polar forms stay available', () => {
  const squareRoot = evaluateComplexExpression('sqrt(-1)', 'DEG');
  assert.ok(Math.abs(squareRoot.re) < 1e-12);
  assert.ok(Math.abs(squareRoot.im - 1) < 1e-12);
  const nested = evaluateComplexExpression('(2∠45°)+1', 'DEG');
  assert.ok(Math.abs(nested.re - (1 + Math.SQRT2)) < 1e-10);
  assert.ok(Math.abs(nested.im - Math.SQRT2) < 1e-10);
  const inverseComplexTrig = evaluateComplexExpression('sin⁻¹(i)', 'DEG');
  assert.ok(Math.abs(inverseComplexTrig.im - (Math.asinh(1) * 180 / Math.PI)) < 1e-10);
  const complexTrig = evaluateComplexExpression('sin(30+i)', 'DEG');
  assert.ok(Number.isFinite(complexTrig.re));
  assert.ok(Number.isFinite(complexTrig.im));
});
