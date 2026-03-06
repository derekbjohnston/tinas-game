import { describe, it, expect, vi } from 'vitest';
import { getServerTime } from './useFirebase';

describe('getServerTime', () => {
  it('adds offset to Date.now()', () => {
    const now = Date.now();
    vi.spyOn(Date, 'now').mockReturnValue(1000);
    expect(getServerTime(500)).toBe(1500);
    vi.restoreAllMocks();
  });

  it('handles negative offset', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1000);
    expect(getServerTime(-200)).toBe(800);
    vi.restoreAllMocks();
  });

  it('handles zero offset', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1000);
    expect(getServerTime(0)).toBe(1000);
    vi.restoreAllMocks();
  });
});
