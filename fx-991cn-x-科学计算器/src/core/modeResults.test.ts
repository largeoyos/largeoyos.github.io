import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluateExpression } from './calculator';
import { createDefaultModeMemory, evaluateModeExpression } from './modes';
import { createModeRuntime, dispatchModeRuntime } from './runtime';

const context = { variables: {}, ans: 0, angleMode: 'DEG' as const };

test('matrix and vector support scalar-left multiplication and vector magnitude', () => {
  const memory = createDefaultModeMemory();
  memory.matrices.MatA = [[1, 2], [3, 4]];
  memory.vectors.VctA = [3, 4];
  assert.deepEqual(evaluateModeExpression('Matrix', '3×MatA', memory, {}, 'DEG').matrix, [[3, 6], [9, 12]]);
  assert.deepEqual(evaluateModeExpression('Vector', '3×VctA', memory, {}, 'DEG').vector, [9, 12]);
  assert.equal(evaluateModeExpression('Vector', 'Abs(VctA)', memory, {}, 'DEG').numeric, 5);
});

test('engineering symbol display setting uses Casio suffixes', () => {
  assert.equal(evaluateExpression('2000', {
    ...context,
    engineeringSymbols: true,
  }).displayText, '2k');
});

test('quadratic equation app appends exact vertex coordinates', () => {
  let state = createModeRuntime();
  state = dispatchModeRuntime(state, { type: 'select-mode', mode: 'Equation' }, context);
  state = dispatchModeRuntime(state, { type: 'append', value: '2' }, context);
  state = dispatchModeRuntime(state, { type: 'append', value: '2' }, context);
  for (const coefficient of ['2', '-3', '-6']) {
    state = dispatchModeRuntime(state, { type: 'append', value: coefficient }, context);
    state = dispatchModeRuntime(state, { type: 'evaluate' }, context);
  }
  assert.equal(state.screen.kind, 'solutions');
  if (state.screen.kind === 'solutions') {
    assert.equal(state.screen.entries?.at(-2)?.label, 'X=');
    assert.equal(state.screen.entries?.at(-1)?.label, 'Y=');
  }
});


test('matrix and complex modes accept the original physical fixed-power keys', () => {
  const memory = createDefaultModeMemory();
  memory.matrices.MatA = [[2, 0], [0, 4]];
  assert.deepEqual(evaluateModeExpression('Matrix', 'MatA²', memory, {}, 'DEG').matrix, [[4, 0], [0, 16]]);
  assert.deepEqual(evaluateModeExpression('Matrix', 'MatA⁻¹', memory, {}, 'DEG').matrix, [[0.5, 0], [0, 0.25]]);
  assert.deepEqual(evaluateModeExpression('Matrix', 'MatA÷2', memory, {}, 'DEG').matrix, [[1, 0], [0, 2]]);
  const complex = evaluateModeExpression('Complex', '(1+i)²', memory, {}, 'DEG').complex;
  assert.ok(complex && Math.abs(complex.re) < 1e-10 && Math.abs(complex.im - 2) < 1e-10);
});


test('mode result formatting applies number, separator and engineering settings', () => {
  const memory = createDefaultModeMemory();
  memory.matrices.MatA = [[2000, 1.25]];
  const matrix = evaluateModeExpression('Matrix', 'MatA', memory, {}, 'DEG', {
    numberFormat: { kind: 'Fix', digits: 2 },
    engineeringSymbols: true,
    decimalPoint: 'comma',
  });
  assert.deepEqual(matrix.matrixDisplay, [['2,00k', '1,25']]);
});

test('complex mode reuses a complex Ans value', () => {
  const memory = createDefaultModeMemory();
  const result = evaluateModeExpression('Complex', 'Ans+1', memory, {}, 'DEG', {
    complexAns: { kind: 'complex', re: 2, im: 3 },
  });
  assert.deepEqual(result.complex, { kind: 'complex', re: 3, im: 3 });
});
