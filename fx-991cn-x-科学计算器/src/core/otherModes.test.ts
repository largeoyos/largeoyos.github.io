import assert from 'node:assert/strict';
import test from 'node:test';
import { generateFunctionTable } from './domains';
import { createModeRuntime, dispatchModeRuntime, runtimeScreenView } from './runtime';

const context = {
  variables: {}, ans: 0, angleMode: 'DEG' as const,
  resultMode: 'exact' as const,
  numberFormat: { kind: 'Norm1' as const },
};

test('Ratio app follows both Casio proportion layouts and retains exact output', () => {
  let state = createModeRuntime();
  state = dispatchModeRuntime(state, { type: 'select-mode', mode: 'Ratio' }, context);
  state = dispatchModeRuntime(state, { type: 'append', value: '1' }, context);
  for (const value of ['2', '3', '6']) {
    state = dispatchModeRuntime(state, { type: 'append', value }, context);
    state = dispatchModeRuntime(state, { type: 'evaluate' }, context);
  }
  assert.equal(state.screen.kind, 'solutions');
  assert.ok(runtimeScreenView(state)?.formulaLines?.[0].document);

  state = createModeRuntime();
  state = dispatchModeRuntime(state, { type: 'select-mode', mode: 'Ratio' }, context);
  state = dispatchModeRuntime(state, { type: 'append', value: '2' }, context);
  for (const value of ['2', '3', '8']) {
    state = dispatchModeRuntime(state, { type: 'append', value }, context);
    state = dispatchModeRuntime(state, { type: 'evaluate' }, context);
  }
  state = dispatchModeRuntime(state, { type: 'toggle-result' }, context);
  assert.equal(runtimeScreenView(state)?.formulaLines?.[0].text, '12');
});

test('Matrix and Vector editors enforce Casio dimensions', () => {
  let matrix = createModeRuntime();
  matrix = dispatchModeRuntime(matrix, { type: 'select-mode', mode: 'Matrix' }, context);
  matrix = dispatchModeRuntime(matrix, { type: 'optn' }, context);
  matrix = dispatchModeRuntime(matrix, { type: 'append', value: '1' }, context);
  matrix = dispatchModeRuntime(matrix, { type: 'append', value: '1' }, context);
  matrix = dispatchModeRuntime(matrix, { type: 'append', value: '5' }, context);
  matrix = dispatchModeRuntime(matrix, { type: 'evaluate' }, context);
  assert.equal(matrix.result, 'Range ERROR');
  assert.equal(matrix.screen.kind, 'dimension');

  let vector = createModeRuntime();
  vector = dispatchModeRuntime(vector, { type: 'select-mode', mode: 'Vector' }, context);
  vector = dispatchModeRuntime(vector, { type: 'optn' }, context);
  vector = dispatchModeRuntime(vector, { type: 'append', value: '1' }, context);
  vector = dispatchModeRuntime(vector, { type: 'append', value: '1' }, context);
  vector = dispatchModeRuntime(vector, { type: 'append', value: '4' }, context);
  vector = dispatchModeRuntime(vector, { type: 'evaluate' }, context);
  assert.equal(vector.result, 'Range ERROR');
});

test('Table app enforces the official 45-row and 30-row limits', () => {
  assert.equal(generateFunctionTable('X', '', 1, 45, 1, {}, 'DEG').length, 45);
  assert.throws(() => generateFunctionTable('X', '', 1, 46, 1, {}, 'DEG'), /Range ERROR/);
  assert.equal(generateFunctionTable('X', 'X^2', 1, 30, 1, {}, 'DEG').length, 30);
  assert.throws(() => generateFunctionTable('X', 'X^2', 1, 31, 1, {}, 'DEG'), /Range ERROR/);
});
