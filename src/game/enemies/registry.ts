import { EnemyType } from '../constants';
import { applyEnemyBody, applyEnemyPhysics } from './common';
import { goombaDefinition } from './goomba';
import { koopaDefinition } from './koopa';
import type { EnemyDefinition, EnemyScene, EnemySpawn } from './types';

type EnemySceneHost = Phaser.Scene & EnemyScene;

export const ENEMY_DEFS = {
  [EnemyType.Goomba]: goombaDefinition,
  [EnemyType.Koopa]: koopaDefinition,
} satisfies Record<EnemyType, EnemyDefinition>;

export const ensureEnemyAssets = (scene: Phaser.Scene): void => {
  Object.values(ENEMY_DEFS).forEach((definition) => {
    definition.createTextures(scene);
    definition.createAnimations(scene);
  });
};

export const getEnemyDefinition = (type: EnemyType): EnemyDefinition | undefined => ENEMY_DEFS[type];

export const spawnEnemy = (
  scene: EnemySceneHost,
  spawn: EnemySpawn,
): Phaser.Physics.Arcade.Sprite | undefined => {
  const definition = ENEMY_DEFS[spawn.type];
  if (!definition) {
    return undefined;
  }

  const enemy = definition.createSprite(scene, spawn);
  enemy.setData('enemyType', definition.type);
  enemy.setData('collidesWithEnemies', definition.collidesWithEnemies ?? true);

  applyEnemyBody(enemy, definition.body);
  applyEnemyPhysics(enemy, definition.speed, spawn.dir);
  definition.configurePhysics?.(enemy, spawn);

  if (definition.animationKey) {
    enemy.play(definition.animationKey);
  }

  scene.getEnemies().add(enemy);
  definition.registerColliders(scene, enemy);
  return enemy;
};
