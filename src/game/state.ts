import { DAMAGE_COOLDOWN_MS } from './constants';

export type TripLevel = number;

export type TripState = {
  level: TripLevel;
  lastDamageAt: number;
  damageCooldownMs: number;
};

export const createTripState = (now: number): TripState => ({
  level: 0,
  lastDamageAt: now - DAMAGE_COOLDOWN_MS,
  damageCooldownMs: DAMAGE_COOLDOWN_MS,
});

export const canTakeDamage = (state: TripState, now: number): boolean =>
  now - state.lastDamageAt >= state.damageCooldownMs;

export const applyMushroom = (state: TripState): TripState => ({
  ...state,
  level: state.level + 1,
});

export const applyDamage = (state: TripState, now: number): TripState => ({
  ...state,
  level: state.level - 1,
  lastDamageAt: now,
});
