import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock useFirebase to control time offset
vi.mock('./useFirebase', () => ({
  useServerTimeOffset: () => 0,
  getServerTime: (offset: number) => Date.now() + offset,
}));

import { useTimer } from './useTimer';

describe('useTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns full 30 seconds when turn is not active', () => {
    const { result } = renderHook(() => useTimer(null, false));
    expect(result.current.remaining).toBe(30);
    expect(result.current.isExpired).toBe(false);
    expect(result.current.fraction).toBe(1);
  });

  it('returns full 30 seconds when turnStartedAt is null', () => {
    const { result } = renderHook(() => useTimer(null, true));
    expect(result.current.remaining).toBe(30);
  });

  it('calculates remaining time from turnStartedAt', () => {
    const now = Date.now();
    vi.setSystemTime(now);

    const turnStartedAt = now - 10_000; // 10 seconds ago
    const { result } = renderHook(() => useTimer(turnStartedAt, true));

    expect(result.current.remaining).toBe(20);
    expect(result.current.isExpired).toBe(false);
  });

  it('shows expired when time is up', () => {
    const now = Date.now();
    vi.setSystemTime(now);

    const turnStartedAt = now - 31_000; // 31 seconds ago
    const { result } = renderHook(() => useTimer(turnStartedAt, true));

    expect(result.current.remaining).toBe(0);
    expect(result.current.isExpired).toBe(true);
    expect(result.current.fraction).toBe(0);
  });

  it('updates remaining as time passes', () => {
    const now = Date.now();
    vi.setSystemTime(now);

    const turnStartedAt = now;
    const { result } = renderHook(() => useTimer(turnStartedAt, true));

    expect(result.current.remaining).toBe(30);

    // Advance 5 seconds
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current.remaining).toBe(25);
  });

  it('resets to 30 when turn becomes inactive', () => {
    const now = Date.now();
    vi.setSystemTime(now);

    const turnStartedAt = now - 10_000;
    const { result, rerender } = renderHook(
      ({ startedAt, active }) => useTimer(startedAt, active),
      { initialProps: { startedAt: turnStartedAt, active: true } }
    );

    expect(result.current.remaining).toBe(20);

    rerender({ startedAt: null, active: false });
    expect(result.current.remaining).toBe(30);
  });

  it('fraction decreases as time passes', () => {
    const now = Date.now();
    vi.setSystemTime(now);

    const turnStartedAt = now - 15_000; // 15 seconds ago
    const { result } = renderHook(() => useTimer(turnStartedAt, true));

    expect(result.current.fraction).toBeCloseTo(0.5, 1);
  });
});
