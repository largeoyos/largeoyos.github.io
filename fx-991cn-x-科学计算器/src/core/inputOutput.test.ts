import assert from 'node:assert/strict';
import test from 'node:test';
import { createModeRuntime, dispatchModeRuntime, runtimeScreenView } from './runtime';

const context = { variables: {}, ans: 0, angleMode: 'DEG' as const };

test('f-only table setting hides the g editor from the original option menu', () => {
  let state = createModeRuntime();
  state = dispatchModeRuntime(state, { type: 'select-mode', mode: 'Function Table' }, {
    ...context,
    tableMode: 'f',
  });
  assert.equal(runtimeScreenView(state)?.lines?.some(line => line.includes('DEFINE G')), false);
});
