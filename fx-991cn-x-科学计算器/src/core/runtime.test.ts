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
test('option menu supports numeric selection, cursor wrap, and clear exit', () => {
  let state = createModeRuntime();
  state = dispatchModeRuntime(state, { type: 'optn' }, context);
  state = dispatchModeRuntime(state, { type: 'up' }, context);
  assert.equal(runtimeScreenView(state)?.selectedIndex, 2);
  state = dispatchModeRuntime(state, { type: 'down' }, context);
  assert.equal(runtimeScreenView(state)?.selectedIndex, 0);
  state = dispatchModeRuntime(state, { type: 'append', value: '1' }, context);
  assert.equal(state.screen.kind, 'menu');
  assert.equal(runtimeScreenView(state)?.title, 'HYPERBOLIC');
  state = dispatchModeRuntime(state, { type: 'append', value: '2' }, context);
  assert.equal(state.screen.kind, 'input');
  assert.equal(state.input, 'cosh(');

  state = dispatchModeRuntime(state, { type: 'optn' }, context);
  state = dispatchModeRuntime(state, { type: 'clear' }, context);
  assert.equal(state.screen.kind, 'input');
});

test('runtime grid menus keep column jumps and solution pages visible', () => {
  let state = createModeRuntime();
  state = dispatchModeRuntime(state, { type: 'select-mode', mode: 'Equation' }, context);
  state = dispatchModeRuntime(state, { type: 'append', value: '1' }, context);
  assert.equal(runtimeScreenView(state)?.title, 'UNKNOWNS');

  state = dispatchModeRuntime(state, { type: 'right' }, context);
  state = dispatchModeRuntime(state, { type: 'right' }, context);
  state = dispatchModeRuntime(state, { type: 'right' }, context);
  assert.equal(runtimeScreenView(state)?.lines?.[3], '5 5 <');

  state = dispatchModeRuntime(state, { type: 'up' }, context);
  const menuView = runtimeScreenView(state);
  assert.equal(menuView?.selectedIndex, 2);
  assert.equal(menuView?.lines?.[2], '9 9 <');

  state = {
    ...state,
    screen: {
      kind: 'solutions',
      lines: ['X1=1', 'X2=2', 'X3=3', 'X4=4', 'X5=5', 'X6=6', 'X7=7'],
      selected: 0,
    },
  };
  for (let i = 0; i < 5; i++) state = dispatchModeRuntime(state, { type: 'down' }, context);
  const solutionView = runtimeScreenView(state);
  assert.deepEqual(solutionView?.lines, ['X6=6', 'X7=7']);
  assert.equal(solutionView?.selectedIndex, 0);
});