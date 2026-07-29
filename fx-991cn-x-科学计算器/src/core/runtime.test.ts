import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createModeRuntime,
  dispatchModeRuntime,
  runtimeScreenView,
} from './runtime';

const context = { variables: {}, ans: 0, angleMode: 'DEG' as const };

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
  assert.equal(runtimeScreenView(state)?.lines?.[3], '5 EXTENDED 5-10 <');

  state = dispatchModeRuntime(state, { type: 'evaluate' }, context);
  assert.equal(runtimeScreenView(state)?.title, 'EXT UNKNOWNS');
  state = dispatchModeRuntime(state, { type: 'up' }, context);
  const menuView = runtimeScreenView(state);
  assert.equal(menuView?.selectedIndex, 4);
  assert.equal(menuView?.lines?.[4], '9 9 <');

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
function openTwoUnknownEditor(runtimeContext = context) {
  let state = createModeRuntime();
  state = dispatchModeRuntime(state, { type: 'select-mode', mode: 'Equation' }, runtimeContext);
  state = dispatchModeRuntime(state, { type: 'append', value: '1' }, runtimeContext);
  state = dispatchModeRuntime(state, { type: 'append', value: '2' }, runtimeContext);
  assert.equal(state.screen.kind, 'coefficient-editor');
  return state;
}

test('mode 8 evaluates real expressions in coefficient cells', () => {
  const runtimeContext = {
    variables: { A: 4, B: 0, C: 0, D: 0, E: 6, F: 0, X: 0, Y: 0, M: 0 },
    ans: 7,
    angleMode: 'DEG' as const,
  };
  const cases = [
    ['1+2', 3],
    ['1/3', 1 / 3],
    ['√2', Math.sqrt(2)],
    ['sin(30)', 0.5],
    ['.2', 0.2],
    ['Ans', 7],
    ['A+1', 5],
    ['E+1', 7],
  ] as const;

  for (const [expression, expected] of cases) {
    let state = openTwoUnknownEditor(runtimeContext);
    state = dispatchModeRuntime(state, { type: 'append', value: expression }, runtimeContext);
    if (expression === '.2' && state.screen.kind === 'coefficient-editor') {
      assert.equal(state.screen.buffer, '0.2');
    }
    state = dispatchModeRuntime(state, { type: 'evaluate' }, runtimeContext);
    assert.equal(state.screen.kind, 'coefficient-editor', expression);
    if (state.screen.kind === 'coefficient-editor') {
      assert.ok(Math.abs(state.screen.values[0][0] - expected) < 1e-12, expression);
      assert.equal(state.screen.row, 0);
      assert.equal(state.screen.column, 1);
    }
  }
});

test('mode 8 advances after evaluation and solves a known system on the last cell', () => {
  const runtimeContext = { variables: {}, ans: 7, angleMode: 'DEG' as const };
  let state = openTwoUnknownEditor(runtimeContext);
  for (const expression of ['sin(90)', '.5+.5', '1+2', '√1', '-1', 'Ans-6']) {
    state = dispatchModeRuntime(state, { type: 'append', value: expression }, runtimeContext);
    state = dispatchModeRuntime(state, { type: 'evaluate' }, runtimeContext);
  }
  assert.equal(state.screen.kind, 'solutions');
  if (state.screen.kind === 'solutions') {
    assert.ok(state.screen.lines.some(line => line.startsWith('X1=2')));
    assert.ok(state.screen.lines.some(line => line.startsWith('X2=1')));
  }
});

test('mode 8 rejects non-real or multi-value coefficients without losing the editor', () => {
  const runtimeContext = { variables: {}, ans: 0, angleMode: 'DEG' as const };
  const cases = [
    ['1/0', 'Math ERROR'],
    ['sqrt(-1)', 'Math ERROR'],
    ['1<2', 'Syntax ERROR'],
    ['1:2', 'Syntax ERROR'],
    ['1+i', 'Syntax ERROR'],
  ] as const;

  for (const [expression, error] of cases) {
    let state = openTwoUnknownEditor(runtimeContext);
    state = dispatchModeRuntime(state, { type: 'append', value: expression }, runtimeContext);
    state = dispatchModeRuntime(state, { type: 'evaluate' }, runtimeContext);
    assert.equal(state.result, error, expression);
    assert.equal(state.screen.kind, 'coefficient-editor', expression);
    if (state.screen.kind === 'coefficient-editor') {
      assert.equal(state.screen.buffer, expression);
      assert.equal(state.screen.row, 0);
      assert.equal(state.screen.column, 0);
    }
  }
});


test('matrix results expose structured cells, touch selection and MatAns chaining', () => {
  const runtimeContext = { variables: {}, ans: 0, angleMode: 'DEG' as const };
  let state = createModeRuntime();
  state.memory.matrices.MatA = [[1, 2], [3, 4]];
  state = dispatchModeRuntime(state, { type: 'select-mode', mode: 'Matrix' }, runtimeContext);
  state = dispatchModeRuntime(state, { type: 'append', value: 'MatA' }, runtimeContext);
  state = dispatchModeRuntime(state, { type: 'evaluate' }, runtimeContext);
  assert.deepEqual(runtimeScreenView(state, runtimeContext)?.matrix, [['1', '2'], ['3', '4']]);
  state = dispatchModeRuntime(state, { type: 'select', row: 1, column: 1 }, runtimeContext);
  assert.deepEqual(state.resultSelection, { row: 1, column: 1 });
  state = dispatchModeRuntime(state, { type: 'append', value: '×' }, runtimeContext);
  assert.equal(state.input, 'MatAns×');
});

test('matrix editors evaluate a real expression instead of coercing Number(buffer)', () => {
  const runtimeContext = { variables: { A: 2 }, ans: 4, angleMode: 'DEG' as const };
  let state = createModeRuntime();
  state = dispatchModeRuntime(state, { type: 'select-mode', mode: 'Matrix' }, runtimeContext);
  state = dispatchModeRuntime(state, { type: 'optn' }, runtimeContext);
  state = dispatchModeRuntime(state, { type: 'append', value: '1' }, runtimeContext);
  state = dispatchModeRuntime(state, { type: 'append', value: '1' }, runtimeContext);
  state = dispatchModeRuntime(state, { type: 'append', value: '2' }, runtimeContext);
  state = dispatchModeRuntime(state, { type: 'evaluate' }, runtimeContext);
  state = dispatchModeRuntime(state, { type: 'append', value: '2' }, runtimeContext);
  state = dispatchModeRuntime(state, { type: 'evaluate' }, runtimeContext);
  state = dispatchModeRuntime(state, { type: 'append', value: 'A+Ans' }, runtimeContext);
  state = dispatchModeRuntime(state, { type: 'evaluate' }, runtimeContext);
  assert.equal(state.screen.kind, 'matrix-editor');
  if (state.screen.kind === 'matrix-editor') assert.equal(state.screen.values[0][0], 6);
});

test('complex OPTION exposes structured insert and prefix conversion commands', () => {
  let state = createModeRuntime();
  state = dispatchModeRuntime(state, { type: 'select-mode', mode: 'Complex' }, context);
  state = dispatchModeRuntime(state, { type: 'optn' }, context);
  assert.equal(state.screen.kind, 'menu');
  if (state.screen.kind === 'menu') {
    assert.equal(state.screen.options.length, 10);
    assert.equal(state.screen.options[8].label, '前式→a+bi');
    assert.equal(state.screen.options[9].label, '前式→r∠θ');
  }
  state = dispatchModeRuntime(state, { type: 'append', value: '9' }, context);
  assert.deepEqual(state.editorCommand, { type: 'convert', format: 'rectangular' });

  state = dispatchModeRuntime(
    { ...state, editorCommand: undefined },
    { type: 'optn' },
    context,
  );
  state = dispatchModeRuntime(state, { type: 'append', value: '3' }, context);
  assert.deepEqual(state.editorCommand, { type: 'insert', value: 'Conjg(' });
});
