import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluateExpression, formatCasioValue } from './calculator';
import { createModeRuntime, dispatchModeRuntime, runtimeScreenView } from './runtime';

const baseContext = { variables: {}, ans: 0, angleMode: 'DEG' as const };

test('decimal mark and digit separator settings format every numeric result', () => {
  assert.equal(formatCasioValue(12345.5, { kind: 'Norm1' }, {
    decimalPoint: 'comma',
    digitSeparator: true,
  }), '12 345,5');
  assert.equal(evaluateExpression('12345.5', {
    ...baseContext,
    decimalPoint: 'comma',
    digitSeparator: true,
  }).displayText, '12 345,5');
});

test('all eleven fx-991CN X engineering symbols evaluate as exact scale factors', () => {
  const cases = [
    ['2ₘ', 2e-3],
    ['2µ', 2e-6],
    ['2ₙ', 2e-9],
    ['2ₚ', 2e-12],
    ['2բ', 2e-15],
    ['2ᴋ', 2e3],
    ['2ℳ', 2e6],
    ['2ɢ', 2e9],
    ['2ᴛ', 2e12],
    ['2ᴘ', 2e15],
    ['2ᴇ', 2e18],
  ] as const;
  for (const [expression, expected] of cases) {
    const result = evaluateExpression(expression, baseContext);
    assert.equal(result.success, true, expression);
    assert.ok(Math.abs(result.value - expected) <= Math.abs(expected) * 1e-12, expression);
  }
});

test('table f-only setting removes g and restores the 45-row limit', () => {
  let state = createModeRuntime();
  state.memory.functions = { f: 'X', g: 'X^2', start: 1, end: 45, step: 1 };
  state = dispatchModeRuntime(state, { type: 'select-mode', mode: 'Function Table' }, {
    ...baseContext,
    tableMode: 'f',
  });
  state = dispatchModeRuntime(state, { type: 'append', value: '4' }, {
    ...baseContext,
    tableMode: 'f',
  });
  assert.equal(state.screen.kind, 'table');
  assert.deepEqual(runtimeScreenView(state)?.table?.[0], ['X', 'F']);
});
