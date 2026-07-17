import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applyUnitConversion,
  SCIENTIFIC_CONSTANTS,
  SCIENTIFIC_CONSTANT_CATEGORIES,
  UNIT_CONVERSIONS,
  UNIT_CONVERSION_CATEGORIES,
} from './catalog';

test('catalog contains the complete classified constants and conversions', () => {
  assert.equal(SCIENTIFIC_CONSTANTS.length, 47);
  assert.equal(UNIT_CONVERSIONS.length, 40);
  assert.equal(SCIENTIFIC_CONSTANT_CATEGORIES.length, 6);
  assert.equal(UNIT_CONVERSION_CATEGORIES.length, 9);
  const temperatureZero = SCIENTIFIC_CONSTANTS.find(item => item.id === 'temperature_zero');
  assert.deepEqual(temperatureZero && {
    symbol: temperatureZero.symbol,
    value: temperatureZero.value,
    unit: temperatureZero.unit,
    category: temperatureZero.category,
  }, { symbol: 't', value: 273.15, unit: 'K', category: '其他' });
});

test('all conversion commands produce finite values and temperature uses an offset', () => {
  for (const command of UNIT_CONVERSIONS) {
    assert.ok(Number.isFinite(applyUnitConversion(1, command.id)), command.id);
  }
  assert.equal(applyUnitConversion(32, 'f_c'), 0);
  assert.equal(applyUnitConversion(100, 'c_f'), 212);
});
