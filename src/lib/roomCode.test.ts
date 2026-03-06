import { describe, it, expect, vi } from 'vitest';
import { isValidRoomCode } from './roomCode';

// We can only unit-test the pure functions since createUniqueRoomCode hits Firebase.

describe('isValidRoomCode', () => {
  it('accepts a valid 4-letter uppercase code', () => {
    expect(isValidRoomCode('ABCD')).toBe(true);
  });

  it('accepts codes without O and I (valid chars)', () => {
    expect(isValidRoomCode('FHQM')).toBe(true);
  });

  it('rejects lowercase', () => {
    expect(isValidRoomCode('abcd')).toBe(false);
  });

  it('rejects codes shorter than 4', () => {
    expect(isValidRoomCode('ABC')).toBe(false);
  });

  it('rejects codes longer than 4', () => {
    expect(isValidRoomCode('ABCDE')).toBe(false);
  });

  it('rejects codes with numbers', () => {
    expect(isValidRoomCode('AB1D')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(isValidRoomCode('')).toBe(false);
  });

  it('rejects codes with spaces', () => {
    expect(isValidRoomCode('AB D')).toBe(false);
  });

  it('rejects codes with special characters', () => {
    expect(isValidRoomCode('AB@D')).toBe(false);
  });
});
