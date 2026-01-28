export const SCREEN_WIDTH = 960;
export const SCREEN_HEIGHT = 540;

export const WORLD_WIDTH = 2800;
export const WORLD_HEIGHT = 540;

export const TILE_SIZE = 32;
export const PLAYER_WIDTH = 26;
export const PLAYER_HEIGHT = 34;
export const ENEMY_SIZE = 26;
export const MUSHROOM_SIZE = 20;

export const PLAYER_SPEED = 190;
export const PLAYER_JUMP_VELOCITY = -420;
export const PLAYER_BOUNCE_VELOCITY = -160;

export const ENEMY_SPEED = 50;
export const MUSHROOM_SPEED = 60;

export const DAMAGE_COOLDOWN_MS = 1200;
export const TRIP_SCALE_STEP = 0.15;
export const TRIP_WOBBLE_FACTOR = 0.008;
export const TRIP_ZOOM_FACTOR = 0.024;
export const TRIP_SPEED_STEP = 0.12;

export enum BlockType {
  Regular = 'regular',
  Powerup = 'powerup',
  Smashable = 'smashable',
}

export enum EnemyType {
  Goomba = 'goomba',
  Koopa = 'koopa',
}
