import assert from 'node:assert/strict';
import test from 'node:test';
import {
  baseBinary,
  baseUnary,
  complexBinary,
  complexConjugate,
  complexFromPolar,
  formatBaseInteger,
  formatComplex,
  generateFunctionTable,
  matrixDeterminant,
  matrixIdentity,
  matrixInverse,
  matrixMultiply,
  regression,
  singleVariableStatistics,
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
});

test('base-n operations use signed 32-bit semantics', () => {
  assert.equal(formatBaseInteger(-1, 16), 'FFFFFFFF');
  assert.equal(baseUnary(0, 'not'), -1);
  assert.equal(baseBinary(0b1010, 0b1100, 'xor'), 0b0110);
});

test('matrix operations include determinant inverse and identity', () => {
  const values = [[2, 1], [1, 1]];
  assert.equal(matrixDeterminant(values), 1);
  assert.deepEqual(matrixMultiply(values, matrixInverse(values)).map(row => row.map(Math.round)), matrixIdentity(2));
});

test('vector operations include dot angle and unit vector', () => {
  assert.equal(vectorDot([1, 0], [0, 1]), 0);
  assert.equal(vectorAngle([1, 0], [0, 1], 'DEG'), 90);
  assert.deepEqual(vectorUnit([3, 4]).map(value => Number(value.toFixed(2))), [0.6, 0.8]);
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
