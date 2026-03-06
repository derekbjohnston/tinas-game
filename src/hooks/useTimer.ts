import { useState, useEffect, useRef } from 'react';
import { useServerTimeOffset, getServerTime } from './useFirebase';

const TURN_DURATION = 30;

export function useTimer(turnStartedAt: number | null, turnActive: boolean) {
  const offset = useServerTimeOffset();
  const [remaining, setRemaining] = useState(TURN_DURATION);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!turnActive || !turnStartedAt) {
      setRemaining(TURN_DURATION);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    function tick() {
      const serverNow = getServerTime(offset);
      const elapsed = (serverNow - turnStartedAt!) / 1000;
      const left = Math.max(0, TURN_DURATION - elapsed);
      setRemaining(left);
    }

    tick();
    intervalRef.current = window.setInterval(tick, 100);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [turnStartedAt, turnActive, offset]);

  return {
    remaining: Math.ceil(remaining),
    remainingExact: remaining,
    isExpired: remaining <= 0,
    fraction: remaining / TURN_DURATION,
  };
}
