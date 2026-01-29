import { EnemyType } from '../constants';
import {
  handleStandardPlayerEnemyOverlap,
  registerCommonEnemyColliders,
  STANDARD_ENEMY_CONTACT,
  updateChasingEnemy,
} from './common';
import type { EnemyDefinition, EnemySpawn } from './types';

const KOOPA_WIDTH = 26;
const KOOPA_HEIGHT = KOOPA_WIDTH * 2;
const KOOPA_SPEED = 50;

export const koopaDefinition: EnemyDefinition = {
  type: EnemyType.Koopa,
  body: {
    width: KOOPA_WIDTH,
    height: KOOPA_HEIGHT,
  },
  speed: KOOPA_SPEED,
  textureKeys: ['koopa-1', 'koopa-2'],
  animationKey: 'koopa-walk',
  createTextures: (scene) => {
    if (scene.textures.exists('koopa-1')) {
      return;
    }

    const eyeY = Math.round(KOOPA_HEIGHT * 0.25);
    const eyeOffset = 2;
    const shellBandY = Math.round(KOOPA_HEIGHT * 0.58);
    const shellBandHeight = 5;

    const koopa = scene.add.graphics();
    koopa.fillStyle(0x3dbf75, 1);
    koopa.fillRoundedRect(0, 0, KOOPA_WIDTH, KOOPA_HEIGHT, 6);
    koopa.fillStyle(0x2a6a4c, 1);
    koopa.fillRect(3, shellBandY, KOOPA_WIDTH - 6, shellBandHeight);
    koopa.fillStyle(0x163823, 1);
    koopa.fillRect(6, eyeY, 6, 6);
    koopa.fillRect(KOOPA_WIDTH - 12, eyeY, 6, 6);
    koopa.generateTexture('koopa-1', KOOPA_WIDTH, KOOPA_HEIGHT);
    koopa.clear();
    koopa.fillStyle(0x54e697, 1);
    koopa.fillRoundedRect(0, 0, KOOPA_WIDTH, KOOPA_HEIGHT, 6);
    koopa.fillStyle(0x2a6a4c, 1);
    koopa.fillRect(3, shellBandY, KOOPA_WIDTH - 6, shellBandHeight);
    koopa.fillStyle(0x163823, 1);
    koopa.fillRect(6, eyeY + eyeOffset, 6, 6);
    koopa.fillRect(KOOPA_WIDTH - 12, eyeY + eyeOffset, 6, 6);
    koopa.generateTexture('koopa-2', KOOPA_WIDTH, KOOPA_HEIGHT);
    koopa.destroy();
  },
  createAnimations: (scene) => {
    const walkFrameRate = 4;
    if (scene.anims.exists('koopa-walk')) {
      return;
    }
    scene.anims.create({
      key: 'koopa-walk',
      frames: [{ key: 'koopa-1' }, { key: 'koopa-2' }],
      frameRate: walkFrameRate,
      repeat: -1,
    });
  },
  createSprite: (scene, spawn: EnemySpawn) =>
    scene.physics.add.sprite(spawn.x, spawn.y, 'koopa-1'),
  registerColliders: (scene, enemy) => {
    registerCommonEnemyColliders(scene, enemy, {
      onBlockCollide: () => {
        updateChasingEnemy(enemy, scene.getPlayer(), KOOPA_SPEED);
      },
      onPlayerOverlap: (player, enemyObj) => {
        handleStandardPlayerEnemyOverlap(scene, player, enemyObj, STANDARD_ENEMY_CONTACT);
      },
    });
  },
  update: (_scene, enemy, context) => {
    updateChasingEnemy(enemy, context.player, KOOPA_SPEED);
  },
};
