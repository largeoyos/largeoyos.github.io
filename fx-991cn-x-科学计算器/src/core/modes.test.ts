import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createDefaultModeMemory,
  evaluateModeExpression,
  modeOptions,
} from './modes';

test('calculate OPTN defaults to three full-screen categories', () => {
  assert.deepEqual(modeOptions('Calculate').map(item => item.label), [
    'HYPERBOLIC',
    'ANGLE UNIT',
    'ENGINEERING',
  ]);
});

test('complex mode evaluates i arithmetic', () => {
  const result = evaluateModeExpression(
    'Complex',
    '(1+i)^2',
    createDefaultModeMemory(),
    {},
    'DEG',
  );
  assert.equal(result.display, '2i');
});

test('base mode evaluates 32-bit logical expressions', () => {
  const memory = createDefaultModeMemory();
  memory.base = 2;
  const result = evaluateModeExpression('Base-N', '1010 xor 1100', memory, {}, 'DEG');
  assert.equal(result.display, '0000000000000110');
});

test('matrix mode evaluates stored matrix expressions', () => {
  const memory = createDefaultModeMemory();
  memory.matrices.MatA = [[1, 2], [3, 4]];
  memory.matrices.MatB = [[1, 0], [0, 1]];
  const result = evaluateModeExpression('Matrix', 'MatA×MatB', memory, {}, 'DEG');
  assert.deepEqual(result.matrix, [[1, 2], [3, 4]]);
});

test('vector mode evaluates dot product', () => {
  const memory = createDefaultModeMemory();
  memory.vectors.VctA = [1, 2, 3];
  memory.vectors.VctB = [4, 5, 6];
  const result = evaluateModeExpression('Vector', 'Dot(VctA,VctB)', memory, {}, 'DEG');
  assert.equal(result.numeric, 32);
});
