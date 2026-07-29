import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createEmptyDocument,
  collectSequences,
  deleteBackward,
  expressionBeforeCursor,
  insertFraction,
  insertFunction,
  insertGlyph,
  insertFormulaInput,
  insertPower,
  insertRoot,
  moveCursor,
  parseLegacyExpression,
  replaceExpressionBeforeCursor,
  serializeExpression,
} from './ast';
import { LCD_HEIGHT, LCD_WIDTH } from './FormulaLcd';
import { layoutNode } from './layout';
import { getBitmapGlyph } from './bitmapFont';
import { factorizeInteger, solveForVariable } from '../core/calculator';
import { evaluateExpression } from '../core/calculator';
import { PHYSICAL_KEYS } from '../core/keymap';

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

test('fraction absorbs the completed expression to its left as the numerator', () => {
  let document = createEmptyDocument();
  for (const input of ['1', '+', '2', '/']) document = insertFormulaInput(document, input);
  assert.equal(serializeExpression(document), '((1+2)/(0))');
  document = insertFormulaInput(document, '3');
  assert.equal(serializeExpression(document), '((1+2)/(3))');

  document = createEmptyDocument();
  for (const input of ['√(', '9', '²']) document = insertFormulaInput(document, input);
  document = moveCursor(document, 'right');
  document = insertFormulaInput(document, '/');
  assert.equal(serializeExpression(document), '((sqrt(((9)^(2))))/(0))');
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

test('calculator symbols have dedicated bitmap glyphs', () => {
  ['×', '÷', 'π', '√', '∫', 'Σ', '°', '²', '³', '⁻', '□', '■', '⇔'].forEach(symbol => {
    assert.notDeepEqual(getBitmapGlyph(symbol), getBitmapGlyph('?'), symbol);
  });
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

test('leading decimal is normalized immediately and duplicate decimal is ignored', () => {
  let document = createEmptyDocument();
  document = insertFormulaInput(document, '.');
  document = insertFormulaInput(document, '2');
  document = insertFormulaInput(document, '.');
  assert.equal(serializeExpression(document), '0.2');
});

test('square captures the full decimal operand and root keeps input until right exit', () => {
  let document = createEmptyDocument();
  for (const input of ['√(', '.', '2', '²', '+', '2', '.', '8', '²']) {
    document = insertFormulaInput(document, input);
  }
  const expression = serializeExpression(document);
  const result = evaluateExpression(expression, { variables: {}, ans: 0, angleMode: 'DEG' });
  assert.equal(result.success, true, expression);
  assert.ok(Math.abs(result.value - 2.80713376952) < 1e-11);
  assert.notEqual(document.cursor.sequenceId, document.root.id);
  document = moveCursor(document, 'right');
  assert.equal(document.cursor.sequenceId, document.root.id);
  assert.equal(document.cursor.offset, 1);
});

test('bare root input opens a structured radicand until the user exits it', () => {
  let document = createEmptyDocument();
  for (const input of ['√', '0', '.', '2', '^', '2', '+', '2', '.', '8', '^', '2']) {
    document = insertFormulaInput(document, input);
  }
  const expression = serializeExpression(document);
  assert.equal(expression, 'sqrt(0.2^2+2.8^2)');
  const result = evaluateExpression(expression, { variables: {}, ans: 0, angleMode: 'DEG' });
  assert.equal(result.success, true);
  assert.ok(result.success && Math.abs(result.value - 2.80713376952) < 1e-11);
});

test('rooted leading decimals remain evaluable through the structured input path', () => {
  let document = createEmptyDocument();
  for (const input of ['√(', '(', '.', '2', '^(', '2', ')']) document = insertFormulaInput(document, input);
  const result = evaluateExpression(serializeExpression(document), { variables: {}, ans: 0, angleMode: 'DEG' });
  assert.equal(result.success, true);
  assert.ok(result.success && Math.abs(result.value - 0.2) < 1e-12);
});

test('fixed power, reciprocal, cube-root index and fixed bases are never editable', () => {
  for (const inputs of [
    ['2', '²'],
    ['2', '³'],
    ['2', '⁻¹'],
    ['³√(', '8'],
    ['10^', '2'],
    ['e^', '2'],
  ]) {
    let document = createEmptyDocument();
    for (const input of inputs) document = insertFormulaInput(document, input);
    const fixed = collectSequences(document.root).filter(item => item.sequence.editable === false);
    assert.ok(fixed.length > 0, inputs.join(' '));
    assert.ok(fixed.every(item => item.sequence.id !== document.cursor.sequenceId));
  }
});

test('group closing and comma advance exit structured containers', () => {
  let group = createEmptyDocument();
  group = insertFormulaInput(group, '(');
  group = insertFormulaInput(group, '1');
  group = insertFormulaInput(group, ')');
  group = insertFormulaInput(group, '+');
  group = insertFormulaInput(group, '2');
  assert.equal(serializeExpression(group), '(1)+2');

  let call = createEmptyDocument();
  call = insertFormulaInput(call, 'log□(');
  call = insertFormulaInput(call, '2');
  call = insertFormulaInput(call, ',');
  call = insertFormulaInput(call, '8');
  call = insertFormulaInput(call, ')');
  assert.equal(serializeExpression(call), 'log(2,8)');
  assert.equal(call.cursor.sequenceId, call.root.id);
});

test('mixed fraction navigation follows whole, numerator, denominator', () => {
  let document = createEmptyDocument();
  document = insertFormulaInput(document, '■ ▭/▭');
  document = insertGlyph(document, '2');
  document = moveCursor(document, 'right');
  document = insertGlyph(document, '1');
  document = moveCursor(document, 'right');
  document = insertGlyph(document, '3');
  assert.equal(serializeExpression(document), 'mixed(2,1,3)');
});

test('every physical insert action has serialization and a legal cursor path', () => {
  const actions = PHYSICAL_KEYS.flatMap(key => [
    key.normal,
    key.shift,
    key.alpha,
    ...Object.values(key.mode ?? {}),
  ]).filter((action): action is { type: 'insert'; value: string } => action?.type === 'insert');

  assert.equal(PHYSICAL_KEYS.length, 50);
  for (const action of actions) {
    const document = insertFormulaInput(createEmptyDocument(), action.value);
    const expression = serializeExpression(document);
    assert.ok(expression.length > 0, action.value);
    assert.ok(!/[□■▭√]/.test(expression), `${action.value}: ${expression}`);
    const cursor = collectSequences(document.root)
      .find(item => item.sequence.id === document.cursor.sequenceId);
    assert.ok(cursor, action.value);
    assert.notEqual(cursor?.sequence.editable, false, action.value);
    assert.ok(document.cursor.offset >= 0 && document.cursor.offset <= (cursor?.sequence.children.length ?? -1));
  }
});

test('complex prefix conversion replaces only the current slot prefix', () => {
  let document = createEmptyDocument();
  for (const value of ['2', '+', '3', 'i']) document = insertFormulaInput(document, value);
  assert.equal(expressionBeforeCursor(document), '2+3i');
  document = replaceExpressionBeforeCursor(document, {
    kind: 'polar',
    radius: '3.60555127546',
    theta: '56.309932474',
  });
  assert.equal(serializeExpression(document), 'polar(3.60555127546,56.309932474)');
  document = insertFormulaInput(document, '×');
  document = insertFormulaInput(document, '2');
  assert.equal(serializeExpression(document), 'polar(3.60555127546,56.309932474)×2');
});

test('rectangular prefix conversion remains grouped for following operations', () => {
  let document = parseLegacyExpression('2∠45');
  document = replaceExpressionBeforeCursor(document, { kind: 'rectangular', text: '1.414+1.414i' });
  document = insertFormulaInput(document, '×');
  document = insertFormulaInput(document, '2');
  assert.equal(serializeExpression(document), '(1.414+1.414i)×2');
});
