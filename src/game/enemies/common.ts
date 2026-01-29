import { PLAYER_BOUNCE_VELOCITY } from '../constants';
import type { EnemyBody, EnemyScene } from './types';

type EnemyContactOptions = {
  stompVelocityThreshold: number;
  knockbackStrength: number;
  knockbackVertical: number;
  bounceVelocity?: number;
};

type EnemyColliderHandlers = {
  onBlockCollide?: (enemy: Phaser.Physics.Arcade.Sprite) => void;
  onPlayerOverlap: (
    player: Phaser.Physics.Arcade.Sprite,
    enemy: Phaser.Physics.Arcade.Sprite,
  ) => void;
};

const enemyGroupColliders = new WeakSet<object>();

export const STANDARD_ENEMY_CONTACT: EnemyContactOptions = {
  stompVelocityThreshold: 80,
  knockbackStrength: 160,
  knockbackVertical: -200,
};

export const applyEnemyBody = (
  enemy: Phaser.Physics.Arcade.Sprite,
  body: EnemyBody,
): void => {
  enemy.setSize(body.width, body.height);
  if (body.offsetX !== undefined || body.offsetY !== undefined) {
    enemy.setOffset(body.offsetX ?? 0, body.offsetY ?? 0);
  }
};

export const applyEnemyPhysics = (
  enemy: Phaser.Physics.Arcade.Sprite,
  speed: number,
  dir: number,
): void => {
  enemy.setCollideWorldBounds(true);
  enemy.setBounce(1, 0);
  enemy.setVelocityX(speed * dir);
};

export const setChaseVelocity = (
  enemy: Phaser.Physics.Arcade.Sprite,
  player: Phaser.Physics.Arcade.Sprite,
  speed: number,
): void => {
  const direction = Math.sign(player.x - enemy.x);
  if (direction === 0) {
    enemy.setVelocityX(0);
    return;
  }
  enemy.setVelocityX(speed * direction);
};

export const updateChasingEnemy = (
  enemy: Phaser.Physics.Arcade.Sprite,
  player: Phaser.Physics.Arcade.Sprite,
  speed: number,
): void => {
  setChaseVelocity(enemy, player, speed);
};

export const registerCommonEnemyColliders = (
  scene: EnemyScene,
  enemy: Phaser.Physics.Arcade.Sprite,
  handlers: EnemyColliderHandlers,
): void => {
  scene.physics.add.collider(enemy, scene.getBlocks(), () => {
    handlers.onBlockCollide?.(enemy);
  });

  if (!enemyGroupColliders.has(scene)) {
    scene.physics.add.collider(
      scene.getEnemies(),
      scene.getEnemies(),
      undefined,
      (firstObj, secondObj) => {
        const first = firstObj as Phaser.Physics.Arcade.Sprite;
        const second = secondObj as Phaser.Physics.Arcade.Sprite;
        if (first === second) {
          return false;
        }
        const firstCollides = first.getData('collidesWithEnemies') !== false;
        const secondCollides = second.getData('collidesWithEnemies') !== false;
        return firstCollides && secondCollides;
      },
    );
    enemyGroupColliders.add(scene);
  }

  scene.physics.add.overlap(scene.getPlayer(), enemy, (playerObj, enemyObj) => {
    handlers.onPlayerOverlap(
      playerObj as Phaser.Physics.Arcade.Sprite,
      enemyObj as Phaser.Physics.Arcade.Sprite,
    );
  });
};

export const handleStandardPlayerEnemyOverlap = (
  scene: EnemyScene,
  player: Phaser.Physics.Arcade.Sprite,
  enemy: Phaser.Physics.Arcade.Sprite,
  options: EnemyContactOptions = STANDARD_ENEMY_CONTACT,
): void => {
  const playerBody = player.body as Phaser.Physics.Arcade.Body;
  const enemyBody = enemy.body as Phaser.Physics.Arcade.Body;
  const stomp =
    playerBody.velocity.y > options.stompVelocityThreshold &&
    playerBody.touching.down &&
    enemyBody.touching.up;

  if (stomp) {
    enemy.destroy();
    const bounceVelocity = options.bounceVelocity ?? PLAYER_BOUNCE_VELOCITY;
    player.setVelocityY(bounceVelocity);
    return;
  }

  if (!scene.applyPlayerDamage(scene.time.now)) {
    return;
  }

  const knockback = player.x < enemy.x ? -options.knockbackStrength : options.knockbackStrength;
  player.setVelocity(knockback, options.knockbackVertical);
};
