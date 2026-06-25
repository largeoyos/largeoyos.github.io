import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createModeRuntime,
  dispatchModeRuntime,
  runtimeScreenView,
} from './runtime';

const context = { variables: {}, angleMode: 'DEG' as const };

test('runtime opens mode-specific option menus', () => {
  let state = createModeRuntime();
  state = dispatchModeRuntime(state, { type: 'optn' }, context);
  assert.equal(state.screen.kind, 'menu');
  assert.deepEqual(runtimeScreenView(state)?.lines?.slice(0, 3), [
    '1 HYPERBOLIC <',
    '2 ANGLE UNIT',
    '3 ENGINEERING',
  ]);
});

test('complex ENG inserts imaginary unit and evaluates', () => {
  let state = createModeRuntime();
  state = dispatchModeRuntime(state, { type: 'select-mode', mode: 'Complex' }, context);
  state = dispatchModeRuntime(state, { type: 'append', value: '1+' }, context);
  state = dispatchModeRuntime(state, { type: 'eng' }, context);
  state = dispatchModeRuntime(state, { type: 'evaluate' }, context);
  assert.equal(state.result, '1+1i');
});

test('matrix editor stores a 2x2 matrix entirely through runtime actions', () => {
  let state = createModeRuntime();
  state = dispatchModeRuntime(state, { type: 'select-mode', mode: 'Matrix' }, context);
  state = dispatchModeRuntime(state, { type: 'optn' }, context);
  state = dispatchModeRuntime(state, { type: 'append', value: '1' }, context);
  state = dispatchModeRuntime(state, { type: 'append', value: '1' }, context);
  state = dispatchModeRuntime(state, { type: 'append', value: '2' }, context);
  state = dispatchModeRuntime(state, { type: 'evaluate' }, context);
  state = dispatchModeRuntime(state, { type: 'append', value: '2' }, context);
  state = dispatchModeRuntime(state, { type: 'evaluate' }, context);
  for (const value of ['1', '2', '3', '4']) {
    state = dispatchModeRuntime(state, { type: 'append', value }, context);
    state = dispatchModeRuntime(state, { type: 'evaluate' }, context);
  }
  assert.deepEqual(state.memory.matrices.MatA, [[1, 2], [3, 4]]);
});
