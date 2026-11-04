import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluateComplexExpression as evaluate, formatComplex } from './domains';
import { evaluateExpression, formatCasioValue } from './calculator';
import { createDefaultModeMemory, evaluateModeExpression } from './modes';

test('real calculations do not depend on an unused complex Ans', () => {
  assert.equal(evaluate('root(3,-8)', 'DEG', {}, { kind: 'complex', re: 1, im: 1 }).re, -2);
});
test('small complex components survive formatting and Ans', () => {
  assert.notEqual(formatComplex({ kind: 'complex', re: 0, im: 1e-12 }), '0');
  assert.equal(evaluate('Ans*1e12', 'DEG', {}, { kind: 'complex', re: 0, im: 1e-12 }).im, 1);
});
test('real odd roots and tangent domains remain consistent in complex expressions', () => {
  const result = evaluate('root(3,-8)+i', 'DEG');
  assert.ok(Math.abs(result.re + 2) < 1e-12);
  assert.ok(Math.abs(result.im - 1) < 1e-12);
  assert.throws(() => evaluate('tan(90)+i', 'DEG'), /Math ERROR/);
});
test('complex calculation rejects invalid logarithm bases and overflows', () => {
  assert.throws(() => evaluate('log(-2,8)+i', 'DEG'), /Math ERROR/);
  assert.throws(() => evaluate('1e100+i', 'DEG'), /Math ERROR/);
});

test('small real values are not rounded to integer zero', () => {
  for (const value of [1e-13, -1e-20, 1e-99]) {
    assert.notEqual(formatCasioValue(value), '0');
  }
});
test('real Ans is forwarded by the complex mode entry point', () => {
  const result = evaluateModeExpression('Complex', 'Ans+i', createDefaultModeMemory(), {}, 'DEG', { ans: 7 });
  assert.equal(result.complex?.re, 7);
  assert.equal(result.complex?.im, 1);
});
test('roots, powers and recursive registered functions in complex mode', () => {
  assert.equal(evaluate('√(.2^2)+i', 'DEG').re, 0.2);
  assert.ok(Math.abs(evaluate('(-1)^0.5', 'DEG').im - 1) < 1e-12);
  assert.throws(() => evaluate('f(i)', 'DEG', {}, 0, { definedFunctions: { f: 'f(X)' } }), /Stack ERROR/);
});
test('normal and complex real arithmetic agree across representative expressions', () => {
  for (const expression of ['√0.2^2', '√(.2^2)', '√0.2^2+2.8^2', '1/3', '-2^2', '2^-2', '2^3^2', '200+10%', '200-10%', '6/2(1+2)', 'sin(30)', 'log(2,8)', 'root(3,-8)', '1e-13']) {
    const expected = evaluateExpression(expression, { variables: {}, ans: 0, angleMode: 'DEG' });
    assert.ok(expected.success, expression);
    assert.equal(evaluate(expression, 'DEG').re, expected.value, expression);
    assert.equal(evaluate(expression, 'DEG', {}, { kind: 'complex', re: 3, im: 4 }).re, expected.value, expression);
  }
});

test('adding an imaginary term preserves the real arithmetic result', () => {
  assert.equal(evaluate('200+10%+i', 'DEG').re, 220);
  assert.equal(formatComplex(evaluate('2∠90', 'DEG')), '2i');
  for (const expression of ['sqrt(.2^2)', '1/3', '-2^2', '2^-2', '2^3^2', '200+10%', '200-10%', '6/2(1+2)', 'sin(30)', 'log(2,8)', 'root(3,-8)', '1e-13']) {
    const expected = evaluateExpression(expression, { variables: {}, ans: 0, angleMode: 'DEG' });
    const actual = evaluate(`(${expression})+i`, 'DEG');
    assert.ok(Math.abs(actual.re - expected.value) <= Math.abs(expected.value) * 1e-12, expression);
    assert.equal(actual.im, 1, expression);
  }
});
