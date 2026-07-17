import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluateExpression } from './calculator';
import { exactValueToNumber } from './exact';

const context = { variables: {}, ans: 0, angleMode: 'DEG' as const };

function evaluate(expression: string) {
  const result = evaluateExpression(expression, context);
  assert.equal(result.success, true, `${expression}: ${result.errorType}`);
  return result;
}

test('exact results are only emitted when they are provable', () => {
  const third = evaluate('1/3');
  assert.ok(third.exact);
  assert.equal(exactValueToNumber(third.exact!), 1 / 3);

  const radical = evaluate('sqrt(8)');
  assert.ok(radical.exact);
  assert.equal(exactValueToNumber(radical.exact!), 2 * Math.sqrt(2));

  const specialAngle = evaluate('sin(30°)');
  assert.ok(specialAngle.exact);
  assert.equal(exactValueToNumber(specialAngle.exact!), 1 / 2);

  assert.equal(evaluate('sin(17°)').exact, undefined);
});

test('scientific constants and conversion suffix commands evaluate as expressions', () => {
  assert.equal(evaluate('const_c').value, 299792458);
  assert.equal(evaluate('conv_in_cm(2+3)').value, 12.7);
  assert.equal(evaluate('conv_f_c(32)').value, 0);
});

test('advanced numerical functions validate bounds and return stable values', () => {
  assert.ok(Math.abs(evaluate('derivative(sin(X),0)').value - Math.PI / 180) < 1e-7);
  assert.ok(Math.abs(evaluate('integral(X^2,0,1)').value - 1 / 3) < 1e-10);
  assert.equal(evaluate('sum(X,1,100)').value, 5050);
  assert.equal(evaluate('gcd(84,30)').value, 6);
  assert.equal(evaluate('lcm(12,18)').value, 36);
});
