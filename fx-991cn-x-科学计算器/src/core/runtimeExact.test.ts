import assert from 'node:assert/strict';
import test from 'node:test';
import { createModeRuntime, dispatchModeRuntime, runtimeScreenView } from './runtime';

const context = {
  variables: {},
  ans: 0,
  angleMode: 'DEG' as const,
  resultMode: 'exact' as const,
  numberFormat: { kind: 'Norm1' as const },
};

test('mode 8 quadratic results use structured exact radicals and S-D toggles only the current root', () => {
  let state = createModeRuntime();
  state = dispatchModeRuntime(state, { type: 'select-mode', mode: 'Equation' }, context);
  state = dispatchModeRuntime(state, { type: 'append', value: '2' }, context);
  state = dispatchModeRuntime(state, { type: 'append', value: '2' }, context);
  for (const coefficient of ['1', '1', '-1']) {
    state = dispatchModeRuntime(state, { type: 'append', value: coefficient }, context);
    state = dispatchModeRuntime(state, { type: 'evaluate' }, context);
  }
  assert.equal(state.screen.kind, 'solutions');
  const exactView = runtimeScreenView(state);
  assert.equal(exactView?.formulaLines?.length, 2);
  assert.ok(exactView?.formulaLines?.[0].document);
  assert.ok(exactView?.formulaLines?.[1].document);

  state = dispatchModeRuntime(state, { type: 'toggle-result' }, context);
  const decimalView = runtimeScreenView(state);
  assert.ok(decimalView?.formulaLines?.[0].text);
  assert.ok(decimalView?.formulaLines?.[1].document);

  state = dispatchModeRuntime(state, { type: 'down' }, context);
  const nextRoot = runtimeScreenView(state);
  assert.ok(nextRoot?.formulaLines?.[1].document);
});

test('mode 8 keeps coefficient expressions and exact fractions', () => {
  let state = createModeRuntime();
  state = dispatchModeRuntime(state, { type: 'select-mode', mode: 'Equation' }, context);
  state = dispatchModeRuntime(state, { type: 'append', value: '1' }, context);
  state = dispatchModeRuntime(state, { type: 'append', value: '2' }, context);
  for (const coefficient of ['1/3', '0', '1', '0', '1', '2']) {
    state = dispatchModeRuntime(state, { type: 'append', value: coefficient }, context);
    state = dispatchModeRuntime(state, { type: 'evaluate' }, context);
  }
  assert.equal(state.screen.kind, 'solutions');
  const view = runtimeScreenView(state);
  assert.ok(view?.formulaLines?.every(line => line.document));
});
