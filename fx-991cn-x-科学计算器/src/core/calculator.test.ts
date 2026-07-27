import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluateExpression, solveForVariable, type EvaluationContext } from './calculator';

const context: EvaluationContext = {
  variables: { A: 4, B: 0, C: 0, D: 0, E: 0, F: 0, X: 0, Y: 0, M: 0 },
  ans: 7,
  angleMode: 'DEG',
};

function value(expression: string, ctx = context): number {
  const result = evaluateExpression(expression, ctx);
  assert.equal(result.success, true, `${expression}: ${result.displayText}`);
  return result.value;
}

function error(expression: string, type: string, ctx = context): void {
  const result = evaluateExpression(expression, ctx);
  assert.equal(result.success, false, expression);
  assert.equal(result.errorType, type, expression);
}

test('leading and repeated decimal points are handled strictly', () => {
  assert.equal(value('.2'), 0.2);
  error('1..2', 'Syntax ERROR');
});

test('power precedence follows calculator rules', () => {
  assert.equal(value('-2²'), -4);
  assert.equal(value('2^-2'), 0.25);
  assert.equal(value('2^3^2'), 512);
});

test('roots evaluate complete expressions and real odd roots', () => {
  assert.ok(Math.abs(value('sqrt(0.2²+2.8²)') - 2.80713376952) < 1e-11);
  assert.ok(Math.abs(value('√0.2^2+2.8^2') - 2.80713376952) < 1e-11);
  assert.equal(value('√(.2^2)'), 0.2);
  assert.equal(value('√0.2^2'), 0.2);
  assert.equal(value('³√8'), 2);
  assert.equal(value('root(3,-8)'), -2);
  error('root(2,-8)', 'Math ERROR');
});

test('percent uses Casio contextual semantics', () => {
  assert.equal(value('50%'), 0.5);
  assert.equal(value('200×10%'), 20);
  assert.equal(value('200+10%'), 220);
  assert.equal(value('200−10%'), 180);
});

test('degree suffix and function domains are validated', () => {
  assert.ok(Math.abs(value('sin(90°)', { ...context, angleMode: 'RAD' }) - 1) < 1e-12);
  error('tan(90°)', 'Math ERROR');
  error('log(1,10)', 'Math ERROR');
  error('log(-1)', 'Math ERROR');
  error('sqrt(-1)', 'Math ERROR');
});

test('implicit multiplication remains supported', () => {
  assert.ok(Math.abs(value('2π') - 2 * Math.PI) < 1e-12);
  assert.equal(value('2(3+4)'), 14);
  assert.equal(value('2Ans'), 14);
});


test('implicit multiplication binds before explicit division like fx-991CN X', () => {
  assert.ok(Math.abs(evaluateExpression('6÷2(1+2)', context).value - 1) < 1e-12);
  assert.ok(Math.abs(evaluateExpression('1÷(2+3)sin(30)', context).value - 0.4) < 1e-12);
  assert.ok(Math.abs(evaluateExpression('6÷2π', context).value - 3 / Math.PI) < 1e-12);
  assert.ok(Math.abs(evaluateExpression('2÷2√2', context).value - 1 / Math.sqrt(2)) < 1e-12);
});
test('mixed fractions, variables and utility functions are finite real values', () => {
  assert.equal(value('mixed(2,1,3)'), 7 / 3);
  assert.equal(value('mixed(-2,1,3)'), -7 / 3);
  assert.equal(value('A+Ans'), 11);
  assert.equal(value('10^2'), 100);
  assert.ok(Math.abs(value('e^1') - Math.E) < 1e-12);
  assert.equal(value('Rnd(1.234567890123)'), 1.2345678901);
});


test('fx-991CN X input length and numeric range limits are enforced', () => {
  const tooLong = evaluateExpression('1'.repeat(200), context);
  assert.equal(tooLong.errorType, 'Syntax ERROR');
  assert.equal(evaluateExpression('1e100', context).errorType, 'Math ERROR');
  assert.equal(evaluateExpression('1e-100', context).value, 0);
});


test('remainder division stores the quotient in Ans and retains both display values', () => {
  const result = evaluateExpression('9÷R4', context);
  assert.equal(result.success, true);
  assert.equal(result.value, 2);
  assert.equal(result.displayText, 'Q=2, R=1');
});

test('SOLVE accepts an expression equal to zero and prefers the root nearest the initial value', () => {
  const positive = solveForVariable('X^2-4', 'X', { ...context, variables: { ...context.variables, X: 1 } });
  assert.equal(positive.success, true);
  assert.ok(Math.abs(positive.value - 2) < 1e-8);
  const negative = solveForVariable('X^2-4=0', 'X', { ...context, variables: { ...context.variables, X: -1 } });
  assert.equal(negative.success, true);
  assert.ok(Math.abs(negative.value + 2) < 1e-8);
});


test('radian gradian and DMS suffixes follow the active angle unit', () => {
  assert.ok(Math.abs(value('sin((π/2)ʳ)') - 1) < 1e-12);
  assert.ok(Math.abs(value('sin(100ᵍ)') - 1) < 1e-12);
  assert.equal(value('1°30′'), 1.5);
  assert.equal(value('-1°30′'), -1.5);
  assert.equal(evaluateExpression('todms(1.5)', context).displayText, '1°30′0″');
  error('dms(1,60,0)', 'Argument ERROR');
});
