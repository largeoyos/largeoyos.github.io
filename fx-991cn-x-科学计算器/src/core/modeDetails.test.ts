import assert from 'node:assert/strict';
import test from 'node:test';
import {
  normalProbability,
  standardizedVariable,
} from './domains';
import { createModeRuntime, dispatchModeRuntime } from './runtime';

const context = { variables: {}, ans: 0, angleMode: 'DEG' as const };

test('Casio P Q R and standardized t use the single-variable dataset', () => {
  assert.ok(Math.abs(normalProbability('P', 0) - 0.5) < 1e-7);
  assert.ok(Math.abs(normalProbability('Q', 0)) < 1e-7);
  assert.ok(Math.abs(normalProbability('R', 0) - 0.5) < 1e-7);
  assert.equal(standardizedVariable([{ x: 0 }, { x: 2 }], 1), 0);
});

test('matrix define edit and copy remain distinct Casio operations', () => {
  let state = createModeRuntime();
  state.memory.matrices.MatA = [[1, 2], [3, 4]];
  state = dispatchModeRuntime(state, { type: 'select-mode', mode: 'Matrix' }, context);
  state = dispatchModeRuntime(state, { type: 'optn' }, context);
  state = dispatchModeRuntime(state, { type: 'append', value: '2' }, context);
  state = dispatchModeRuntime(state, { type: 'append', value: '1' }, context);
  assert.equal(state.screen.kind, 'matrix-editor');

  state = dispatchModeRuntime(state, { type: 'clear' }, context);
  state = dispatchModeRuntime(state, { type: 'optn' }, context);
  state = dispatchModeRuntime(state, { type: 'append', value: '3' }, context);
  state = dispatchModeRuntime(state, { type: 'append', value: '1' }, context);
  state = dispatchModeRuntime(state, { type: 'append', value: '2' }, context);
  assert.equal(state.screen.kind, 'matrix-editor');
  if (state.screen.kind === 'matrix-editor') {
    assert.equal(state.screen.target, 'MatB');
    assert.deepEqual(state.screen.values, [[1, 2], [3, 4]]);
  }
});


test('statistics data clears when frequency setting changes or statistics mode exits', () => {
  let state = createModeRuntime();
  state.memory.statistics.rows = [{ x: 1 }];
  state = dispatchModeRuntime(state, { type: 'select-mode', mode: 'Statistics' }, context);
  state = dispatchModeRuntime(state, { type: 'append', value: '6' }, context);
  assert.deepEqual(state.memory.statistics.rows, []);
  state.memory.statistics.rows = [{ x: 2 }];
  state = dispatchModeRuntime(state, { type: 'select-mode', mode: 'Calculate' }, context);
  assert.deepEqual(state.memory.statistics.rows, []);
});
