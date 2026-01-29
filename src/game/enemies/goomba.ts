import { EnemyType } from '../constants';
import {
  handleStandardPlayerEnemyOverlap,
  registerCommonEnemyColliders,
  STANDARD_ENEMY_CONTACT,
  updateChasingEnemy,
} from './common';
import type { EnemyDefinition, EnemySpawn } from './types';

const GOOMBA_SIZE = 26;
const GOOMBA_SPEED = 50;

export const goombaDefinition: EnemyDefinition = {
  type: EnemyType.Goomba,
  body: {
    width: GOOMBA_SIZE,
    height: GOOMBA_SIZE,
  },
  speed: GOOMBA_SPEED,
  textureKeys: ['goomba-1', 'goomba-2'],
  animationKey: 'goomba-walk',
  createTextures: (scene) => {
    if (scene.textures.exists('goomba-1')) {
      return;
    }

    const goomba = scene.add.graphics();
    goomba.fillStyle(0xd77a3d, 1);
    goomba.fillRoundedRect(0, 0, GOOMBA_SIZE, GOOMBA_SIZE, 6);
    goomba.fillStyle(0x2f2018, 1);
    goomba.fillRect(6, 8, 6, 6);
    goomba.fillRect(GOOMBA_SIZE - 12, 8, 6, 6);
    goomba.generateTexture('goomba-1', GOOMBA_SIZE, GOOMBA_SIZE);
    goomba.clear();
    goomba.fillStyle(0xe0a56a, 1);
    goomba.fillRoundedRect(0, 0, GOOMBA_SIZE, GOOMBA_SIZE, 6);
    goomba.fillStyle(0x2f2018, 1);
    goomba.fillRect(6, 10, 6, 6);
    goomba.fillRect(GOOMBA_SIZE - 12, 10, 6, 6);
    goomba.generateTexture('goomba-2', GOOMBA_SIZE, GOOMBA_SIZE);
    goomba.destroy();
  },
  createAnimations: (scene) => {
    const walkFrameRate = 4;
    if (scene.anims.exists('goomba-walk')) {
      return;
    }
    scene.anims.create({
      key: 'goomba-walk',
      frames: [{ key: 'goomba-1' }, { key: 'goomba-2' }],
      frameRate: walkFrameRate,
      repeat: -1,
    });
  },
  createSprite: (scene, spawn: EnemySpawn) =>
    scene.physics.add.sprite(spawn.x, spawn.y, 'goomba-1'),
  registerColliders: (scene, enemy) => {
    registerCommonEnemyColliders(scene, enemy, {
      onBlockCollide: () => {
        updateChasingEnemy(enemy, scene.getPlayer(), GOOMBA_SPEED);
      },
      onPlayerOverlap: (player, enemyObj) => {
        handleStandardPlayerEnemyOverlap(scene, player, enemyObj, STANDARD_ENEMY_CONTACT);
      },
    });
  },
  update: (_scene, enemy, context) => {
    updateChasingEnemy(enemy, context.player, GOOMBA_SPEED);
  },
};
