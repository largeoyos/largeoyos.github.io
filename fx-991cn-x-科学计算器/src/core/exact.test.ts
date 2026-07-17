import assert from 'node:assert/strict';
import test from 'node:test';
import {
  exactRational,
  exactValueToNumber,
  quadraticExactRoots,
  rational,
  solveLinearSystemExact,
} from './exact';

test('exact Gaussian elimination preserves rational coefficients', () => {
  const result = solveLinearSystemExact(
    [[rational(2), rational(1)], [rational(1), rational(-1)]],
    [rational(0), rational(1)],
  );
  assert.equal(result.status, 'unique');
  if (result.status === 'unique') {
    assert.deepEqual(result.values, [rational(1, 3), rational(-2, 3)]);
  }
});

test('quadratic exact roots retain radicals and complex values', () => {
  const golden = quadraticExactRoots([rational(1), rational(1), rational(-1)]);
  assert.equal(golden.length, 2);
  assert.ok(Math.abs(exactValueToNumber(golden[0]) - (-1 - Math.sqrt(5)) / 2) < 1e-12);
  assert.ok(Math.abs(exactValueToNumber(golden[1]) - (-1 + Math.sqrt(5)) / 2) < 1e-12);

  const imaginary = quadraticExactRoots([rational(1), rational(0), rational(1)]);
  assert.equal(imaginary[0].kind, 'exact-complex');
  assert.equal(imaginary[1].kind, 'exact-complex');
  assert.equal(exactValueToNumber(exactRational(rational(1, 3))), 1 / 3);
});
