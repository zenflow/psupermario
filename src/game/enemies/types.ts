import type { EnemyType } from '../constants';

export type EnemySpawn = {
  x: number;
  y: number;
  type: EnemyType;
  dir: number;
};

export type EnemyBody = {
  width: number;
  height: number;
  offsetX?: number;
  offsetY?: number;
};

export type EnemyContext = {
  player: Phaser.Physics.Arcade.Sprite;
  now: number;
  delta: number;
};

export type EnemyScene = {
  physics: Phaser.Physics.Arcade.ArcadePhysics;
  time: Phaser.Time.Clock;
  getPlayer: () => Phaser.Physics.Arcade.Sprite;
  getBlocks: () => Phaser.Physics.Arcade.StaticGroup;
  getEnemies: () => Phaser.Physics.Arcade.Group;
  applyPlayerDamage: (now: number) => boolean;
};

export type EnemyDefinition = {
  type: EnemyType;
  body: EnemyBody;
  speed: number;
  textureKeys: string[];
  animationKey?: string;
  collidesWithEnemies?: boolean;
  createTextures: (scene: Phaser.Scene) => void;
  createAnimations: (scene: Phaser.Scene) => void;
  createSprite: (scene: Phaser.Scene, spawn: EnemySpawn) => Phaser.Physics.Arcade.Sprite;
  configurePhysics?: (enemy: Phaser.Physics.Arcade.Sprite, spawn: EnemySpawn) => void;
  registerColliders: (scene: EnemyScene, enemy: Phaser.Physics.Arcade.Sprite) => void;
  update?: (scene: EnemyScene, enemy: Phaser.Physics.Arcade.Sprite, context: EnemyContext) => void;
};
