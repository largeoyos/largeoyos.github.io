import assert from 'node:assert/strict';
import test from 'node:test';
import { PHYSICAL_KEYS, resolveKeyAction } from './keymap';

test('all 50 physical keys have unique identifiers and normal actions', () => {
  assert.equal(PHYSICAL_KEYS.length, 50);
  assert.equal(new Set(PHYSICAL_KEYS.map(key => key.id)).size, 50);
  assert.ok(PHYSICAL_KEYS.every(key => key.normal.type !== 'noop'));
});

test('mode overrides preserve special key behavior', () => {
  assert.deepEqual(resolveKeyAction('eng', 'Complex'), { type: 'insert', value: 'i' });
  assert.deepEqual(resolveKeyAction('square', 'Base-N'), { type: 'command', value: 'base-dec' });
});
test('operator and constant keys emit displayable symbols', () => {
  assert.deepEqual(resolveKeyAction('multiply', 'Calculate'), { type: 'insert', value: '×' });
  assert.deepEqual(resolveKeyAction('divide', 'Calculate'), { type: 'insert', value: '÷' });
  assert.deepEqual(resolveKeyAction('scientific', 'Calculate', 'shift'), { type: 'insert', value: 'π' });
  assert.deepEqual(resolveKeyAction('root', 'Calculate'), { type: 'insert', value: '√(' });
});
