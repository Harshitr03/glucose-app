import { describe, expect, test } from 'vitest';
import { suggestSlot } from './constants';

describe('suggestSlot', () => {
  test.each([
    [7, [], 'morning_fasting'],
    [10, [], 'after_breakfast'],
    [15, [], 'after_lunch'],
    [21, [], 'after_dinner'],
  ])('at %i:00 with nothing logged suggests %s', (hour, taken, expected) => {
    expect(suggestSlot(taken, hour)).toBe(expected);
  });

  test('skips a slot that is already logged and moves to the next one', () => {
    expect(suggestSlot(['after_lunch'], 15)).toBe('after_dinner');
  });

  test('falls back to an earlier missed slot late in the day', () => {
    expect(suggestSlot(['after_dinner', 'after_lunch'], 22)).toBe('morning_fasting');
  });

  test('defaults to morning when every slot is logged', () => {
    expect(suggestSlot(['morning_fasting', 'after_breakfast', 'after_lunch', 'after_dinner'], 12)).toBe('morning_fasting');
  });
});
