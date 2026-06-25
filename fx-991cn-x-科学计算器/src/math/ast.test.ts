import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createEmptyDocument,
  deleteBackward,
  insertFraction,
  insertFunction,
  insertGlyph,
  insertPower,
  insertRoot,
  moveCursor,
  serializeExpression,
} from './ast';
import { LCD_HEIGHT, LCD_WIDTH } from './FormulaLcd';
import { layoutNode } from './layout';
import { getBitmapGlyph } from './bitmapFont';
import { factorizeInteger, solveForVariable } from '../core/calculator';

test('log uses two navigable argument slots', () => {
  let document = createEmptyDocument();
  document = insertFunction(document, 'log', 2);
  document = insertGlyph(document, '2');
  document = moveCursor(document, 'right');
  document = insertGlyph(document, '8');
  assert.equal(serializeExpression(document), 'log(2,8)');
});

test('fraction supports numerator to denominator navigation', () => {
  let document = createEmptyDocument();
  document = insertFraction(document);
  document = insertGlyph(document, '1');
  document = moveCursor(document, 'down');
  document = insertGlyph(document, '2');
  assert.equal(serializeExpression(document), '((1)/(2))');
});

test('power wraps the previous node as its base', () => {
  let document = createEmptyDocument();
  document = insertGlyph(document, 'X');
  document = insertPower(document);
  document = insertGlyph(document, '2');
  assert.equal(serializeExpression(document), '((X)^(2))');
});

test('indexed root navigates from index to radicand', () => {
  let document = createEmptyDocument();
  document = insertRoot(document, true);
  document = insertGlyph(document, '3');
  document = moveCursor(document, 'right');
  document = insertGlyph(document, '8');
  assert.equal(serializeExpression(document), 'root(3,8)');
});

test('deleting an empty nested value restores its placeholder value', () => {
  let document = createEmptyDocument();
  document = insertRoot(document, false);
  document = insertGlyph(document, '9');
  document = deleteBackward(document);
  assert.equal(serializeExpression(document), 'sqrt(0)');
});

test('layout boxes use positive integer measurements', () => {
  let document = createEmptyDocument();
  document = insertFraction(document);
  const box = layoutNode(document.root);
  assert.ok(Number.isInteger(box.width) && box.width > 0);
  assert.ok(Number.isInteger(box.height) && box.height > 0);
  assert.ok(Number.isInteger(box.baseline) && box.baseline >= 0);
});

test('LCD backing buffer uses eight-times logical resolution', () => {
  assert.equal(LCD_WIDTH, 1536);
  assert.equal(LCD_HEIGHT, 504);
});

test('large integers use BigInt prime factorization', () => {
  assert.equal(factorizeInteger('1000036000099'), '1000003 x 1000033');
});

test('equation solver returns multiple real roots', () => {
  const result = solveForVariable('X^2=4', 'X', {
    variables: {},
    ans: 0,
    angleMode: 'DEG',
  });
  assert.equal(result.success, true);
  assert.deepEqual(result.roots?.map(value => Math.round(value)), [-2, 2]);
});

test('equation solver keeps more than two distinct real roots', () => {
  const result = solveForVariable('X^4-5*X^2+4=0', 'X', {
    variables: {},
    ans: 0,
    angleMode: 'DEG',
  });
  assert.equal(result.success, true);
  assert.deepEqual(result.roots?.map(value => Math.round(value)), [-2, -1, 1, 2]);
});

test('multiplication and division have dedicated bitmap glyphs', () => {
  assert.notDeepEqual(getBitmapGlyph('×'), getBitmapGlyph('?'));
  assert.notDeepEqual(getBitmapGlyph('÷'), getBitmapGlyph('?'));
});

test('right enters a compound node before moving past it and wraps at root end', () => {
  let document = createEmptyDocument();
  document = insertFunction(document, 'log', 2);
  document.cursor = { sequenceId: document.root.id, offset: 0 };
  document = moveCursor(document, 'right');
  assert.notEqual(document.cursor.sequenceId, document.root.id);
  document = insertGlyph(document, '2');
  document = moveCursor(document, 'right');
  document = insertGlyph(document, '8');
  document = moveCursor(document, 'right');
  assert.equal(document.cursor.sequenceId, document.root.id);
  assert.equal(document.cursor.offset, 1);
  document = moveCursor(document, 'right');
  assert.equal(document.cursor.offset, 0);
});

test('left from after a compound node enters its last slot', () => {
  let document = createEmptyDocument();
  document = insertFunction(document, 'log', 2);
  document.cursor = { sequenceId: document.root.id, offset: 1 };
  document = moveCursor(document, 'left');
  assert.notEqual(document.cursor.sequenceId, document.root.id);
});