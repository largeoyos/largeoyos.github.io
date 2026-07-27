import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DEFAULT_PREFERENCES,
  SETUP_ROOT_ITEMS,
  parseCalculatorPreferences,
  setupChoiceLabels,
} from './settings';

test('fx-991CN X preferences migrate old saved result settings', () => {
  const preferences = parseCalculatorPreferences(JSON.stringify({
    resultMode: 'decimal',
    numberFormat: { kind: 'Fix', digits: 3 },
  }));
  assert.equal(preferences.version, 4);
  assert.equal(preferences.resultMode, 'decimal');
  assert.deepEqual(preferences.numberFormat, { kind: 'Fix', digits: 3 });
  assert.equal(preferences.inputOutput, 'MathI/MathO');
});

test('setup contains every original setting plus the preserved default-result extension', () => {
  assert.deepEqual(SETUP_ROOT_ITEMS.map(item => item.page), [
    'input-output',
    'angle',
    'number-format',
    'engineering-symbol',
    'fraction-result',
    'complex-result',
    'statistics-frequency',
    'equation-roots',
    'table-mode',
    'decimal-point',
    'digit-separator',
    'multiline-font',
    'language',
    'contrast',
    'result-mode',
  ]);
  assert.equal(setupChoiceLabels('input-output', DEFAULT_PREFERENCES).length, 4);
  assert.equal(setupChoiceLabels('fix', DEFAULT_PREFERENCES).length, 10);
  assert.equal(setupChoiceLabels('sci', DEFAULT_PREFERENCES).length, 10);
});

test('invalid saved settings safely fall back to Casio defaults', () => {
  const preferences = parseCalculatorPreferences(JSON.stringify({
    inputOutput: 'bad',
    angleMode: 'bad',
    contrast: 99,
    numberFormat: { kind: 'Fix', digits: 99 },
  }));
  assert.equal(preferences.inputOutput, 'MathI/MathO');
  assert.equal(preferences.angleMode, 'DEG');
  assert.equal(preferences.contrast, 2);
  assert.deepEqual(preferences.numberFormat, { kind: 'Fix', digits: 9 });
});
