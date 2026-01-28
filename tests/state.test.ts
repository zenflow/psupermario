import { describe, expect, it } from 'vitest';

import {
  applyDamage,
  applyMushroom,
  canTakeDamage,
  createTripState,
} from '../src/game/state';

describe('trip state', () => {
  it('starts at level 0', () => {
    const state = createTripState(1000);
    expect(state.level).toBe(0);
  });

  it('increments on mushroom', () => {
    const state = createTripState(0);
    const next = applyMushroom(state);
    expect(next.level).toBe(1);
  });

  it('decrements on damage', () => {
    const state = createTripState(0);
    const next = applyDamage({ ...state, level: 2 }, 5000);
    expect(next.level).toBe(1);
    expect(next.lastDamageAt).toBe(5000);
  });

  it('respects damage cooldown', () => {
    const state = createTripState(0);
    const damaged = applyDamage(state, 1000);
    expect(canTakeDamage(damaged, 1500)).toBe(false);
    expect(canTakeDamage(damaged, 3000)).toBe(true);
  });
});
