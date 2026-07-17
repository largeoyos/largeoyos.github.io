import assert from 'node:assert/strict';
import test from 'node:test';
import { findNearestCursor, type CursorPoint } from './layout';

test('findNearestCursor chooses the closest horizontal insertion point', () => {
  const points = new Map<string, CursorPoint>([
    ['seq-1:0', { x: 2, top: 11, bottom: 20 }],
    ['seq-1:1', { x: 10, top: 11, bottom: 20 }],
    ['seq-1:2', { x: 18, top: 11, bottom: 20 }],
  ]);

  assert.deepEqual(findNearestCursor(points, 12, 15), { sequenceId: 'seq-1', offset: 1 });
  assert.deepEqual(findNearestCursor(points, 17, 15), { sequenceId: 'seq-1', offset: 2 });
});

test('findNearestCursor respects vertical formula slots', () => {
  const points = new Map<string, CursorPoint>([
    ['numerator:0', { x: 20, top: 11, bottom: 18 }],
    ['denominator:0', { x: 20, top: 23, bottom: 30 }],
  ]);

  assert.deepEqual(findNearestCursor(points, 20, 13), { sequenceId: 'numerator', offset: 0 });
  assert.deepEqual(findNearestCursor(points, 20, 28), { sequenceId: 'denominator', offset: 0 });
});

test('findNearestCursor favors the narrower nested slot when positions overlap', () => {
  const points = new Map<string, CursorPoint>([
    ['root:1', { x: 30, top: 11, bottom: 34 }],
    ['radicand:0', { x: 30, top: 17, bottom: 24 }],
  ]);

  assert.deepEqual(findNearestCursor(points, 30, 20), { sequenceId: 'radicand', offset: 0 });
});

test('findNearestCursor returns undefined when there are no editable points', () => {
  assert.equal(findNearestCursor(new Map(), 10, 10), undefined);
});
