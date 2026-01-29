import * as Phaser from 'phaser';

import {
  BlockType,
  DAMAGE_COOLDOWN_MS,
  SCREEN_HEIGHT,
  SCREEN_WIDTH,
  TILE_SIZE,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from '../game/constants';
import type { EnemyType } from '../game/constants';
import {
  applyDamage,
  applyMushroom,
  canTakeDamage,
  createTripState,
  type TripState,
} from '../game/state';

type BlockData = {
  type: BlockType;
  used?: boolean;
  lastHitAt?: number;
};

type EnemySpawn = {
  x: number;
  y: number;
  type: EnemyType;
  dir: number;
};

const PLAYER_WIDTH = 26;
const PLAYER_HEIGHT = 34;
const PLAYER_CROUCH_HEIGHT = 22;
const PLAYER_OFFSET_X = 3;
const PLAYER_OFFSET_Y = 2;
const PLAYER_CROUCH_OFFSET_Y = PLAYER_OFFSET_Y + (PLAYER_HEIGHT - PLAYER_CROUCH_HEIGHT);
const ENEMY_SIZE = 26;
const MUSHROOM_SIZE = 20;
const PLAYER_BOUNCE_VELOCITY = -160;
const ENEMY_SPEED = 50;

export abstract class WorldScene extends Phaser.Scene {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private player!: Phaser.Physics.Arcade.Sprite;
  private blocks!: Phaser.Physics.Arcade.StaticGroup;
  private enemies!: Phaser.Physics.Arcade.Group;
  private mushrooms!: Phaser.Physics.Arcade.Group;
  private tripState!: TripState;
  private tripText!: Phaser.GameObjects.Text;
  private jumpLabel!: Phaser.GameObjects.Text;
  private jumpGauge!: Phaser.GameObjects.Graphics;
  private lastJumpGaugeRemaining = -1;
  private lastJumpGaugeTotal = -1;
  private uiCamera!: Phaser.Cameras.Scene2D.Camera;
  private uiLayer!: Phaser.GameObjects.Layer;
  private isCrouching = false;
  private wasCrouching = false;
  private jumpsUsed = 0;
  private wasOnGround = false;

  protected constructor(sceneKey: string) {
    super(sceneKey);
  }

  protected abstract addBackground(): void;
  protected abstract buildLevel(): void;
  protected abstract getEnemySpawns(): EnemySpawn[];

  public create(): void {
    this.addBackground();
    this.createPlaceholderTextures();

    const keyboard = this.input.keyboard;
    if (!keyboard) {
      throw new Error('Keyboard input is required but unavailable.');
    }
    this.cursors = keyboard.createCursorKeys();
    this.tripState = createTripState(this.time.now);

    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    this.blocks = this.physics.add.staticGroup();
    this.buildLevel();

    const playerStartX = 160;
    const playerStartY = 320;
    this.player = this.physics.add.sprite(playerStartX, playerStartY, 'player');
    this.player.setCollideWorldBounds(true);
    this.updatePlayerPose(false);
    this.player.setDepth(2);

    this.enemies = this.physics.add.group({ allowGravity: true });
    this.mushrooms = this.physics.add.group({ allowGravity: true });
    this.spawnEnemies();

    this.physics.add.collider(this.player, this.blocks, (playerObj, blockObj) => {
      this.handlePlayerBlockCollision(
        playerObj as Phaser.Physics.Arcade.Sprite,
        blockObj as Phaser.Physics.Arcade.Image,
      );
    });
    this.physics.add.collider(this.mushrooms, this.blocks);
    this.physics.add.collider(this.enemies, this.blocks, (enemyObj) => {
      this.handleEnemyBlockCollision(enemyObj as Phaser.Physics.Arcade.Sprite);
    });
    this.physics.add.collider(this.enemies, this.enemies);
    this.physics.add.overlap(this.player, this.mushrooms, (playerObj, itemObj) => {
      this.handlePlayerMushroom(
        playerObj as Phaser.Physics.Arcade.Sprite,
        itemObj as Phaser.Physics.Arcade.Sprite,
      );
    });
    this.physics.add.overlap(this.player, this.enemies, (playerObj, enemyObj) => {
      this.handlePlayerEnemy(
        playerObj as Phaser.Physics.Arcade.Sprite,
        enemyObj as Phaser.Physics.Arcade.Sprite,
      );
    });

    this.setupHud();
    const hudPadding = 16;
    this.tripText = this.addHudText(hudPadding, hudPadding, '', {
      fontFamily: 'Trebuchet MS',
      fontSize: '18px',
      color: '#f5f3ff',
    });
    const jumpGaugeY = hudPadding + 30;
    this.jumpLabel = this.addHudText(hudPadding, jumpGaugeY, 'Jumps', {
      fontFamily: 'Trebuchet MS',
      fontSize: '14px',
      color: '#c6c3d6',
    });
    this.jumpGauge = this.add.graphics();
    this.jumpGauge.setScrollFactor(0);
    this.uiLayer.add(this.jumpGauge);
    this.refreshUiCameraMask();
    this.updateTripUI();

    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
  }

  public update(time: number): void {
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const onGround = body.blocked.down;
    const tripLevel = Math.max(0, this.tripState.level);
    const maxExtraJumps = tripLevel;
    const baseSpeed = 190;
    const speedMultiplierBase = 1.35;
    const crouchSpeedMultiplier = 0.35;
    const jumpVelocity = -420;
    const fallOutOffset = 200;

    if (onGround && !this.wasOnGround) {
      this.jumpsUsed = 0;
    }

    this.isCrouching = this.cursors.down?.isDown === true && onGround;
    if (this.isCrouching !== this.wasCrouching) {
      this.updatePlayerPose(this.isCrouching);
      this.wasCrouching = this.isCrouching;
    }
    const scaledSpeed = baseSpeed * Math.pow(speedMultiplierBase, tripLevel);
    const moveSpeed = this.isCrouching ? scaledSpeed * crouchSpeedMultiplier : scaledSpeed;

    if (this.cursors.left?.isDown) {
      this.player.setVelocityX(-moveSpeed);
      this.player.setFlipX(true);
    } else if (this.cursors.right?.isDown) {
      this.player.setVelocityX(moveSpeed);
      this.player.setFlipX(false);
    } else {
      this.player.setVelocityX(0);
    }

    const canMidAirJump = !onGround && this.jumpsUsed > 0 && this.jumpsUsed <= maxExtraJumps;
    if (
      this.cursors.up &&
      Phaser.Input.Keyboard.JustDown(this.cursors.up) &&
      (onGround || canMidAirJump)
    ) {
      this.player.setVelocityY(jumpVelocity);
      this.jumpsUsed += 1;
    }

    const totalJumps = 1 + maxExtraJumps;
    const remainingJumps = onGround
      ? totalJumps
      : Math.max(0, totalJumps - this.jumpsUsed);
    this.updateJumpGauge(remainingJumps, totalJumps);

    this.wasOnGround = onGround;

    this.applyTripVisuals(time);
    this.updateEnemyChase();

    if (this.player.y > WORLD_HEIGHT + fallOutOffset) {
      this.triggerGameOver('You slipped past the world edge.');
    }
  }

  private createPlaceholderTextures(): void {
    if (this.textures.exists('player')) {
      return;
    }

    const block = this.add.graphics();
    block.fillStyle(0x3f3848, 1);
    block.fillRoundedRect(0, 0, TILE_SIZE, TILE_SIZE, 4);
    block.generateTexture('block', TILE_SIZE, TILE_SIZE);
    block.clear();

    block.fillStyle(0x7c5b2a, 1);
    block.fillRoundedRect(0, 0, TILE_SIZE, TILE_SIZE, 4);
    block.lineStyle(2, 0xf2d27a, 1);
    block.strokeRoundedRect(4, 4, TILE_SIZE - 8, TILE_SIZE - 8, 3);
    block.generateTexture('block-power', TILE_SIZE, TILE_SIZE);
    block.clear();

    block.fillStyle(0x6b324a, 1);
    block.fillRoundedRect(0, 0, TILE_SIZE, TILE_SIZE, 4);
    block.lineStyle(2, 0xe18cab, 1);
    block.strokeRoundedRect(4, 4, TILE_SIZE - 8, TILE_SIZE - 8, 3);
    block.generateTexture('block-smash', TILE_SIZE, TILE_SIZE);
    block.destroy();

    const player = this.add.graphics();
    player.fillStyle(0x6de1ff, 1);
    player.fillRoundedRect(0, 0, PLAYER_WIDTH, PLAYER_HEIGHT, 6);
    player.fillStyle(0x1b1b2a, 1);
    player.fillRect(5, 8, 6, 6);
    player.fillRect(PLAYER_WIDTH - 11, 8, 6, 6);
    player.generateTexture('player', PLAYER_WIDTH, PLAYER_HEIGHT);
    player.clear();
    const crouchY = PLAYER_HEIGHT - PLAYER_CROUCH_HEIGHT;
    player.fillStyle(0x6de1ff, 1);
    player.fillRoundedRect(0, crouchY, PLAYER_WIDTH, PLAYER_CROUCH_HEIGHT, 6);
    player.fillStyle(0x1b1b2a, 1);
    player.fillRect(5, crouchY + 6, 6, 6);
    player.fillRect(PLAYER_WIDTH - 11, crouchY + 6, 6, 6);
    player.generateTexture('player-crouch', PLAYER_WIDTH, PLAYER_HEIGHT);
    player.destroy();

    const goomba = this.add.graphics();
    goomba.fillStyle(0xd77a3d, 1);
    goomba.fillRoundedRect(0, 0, ENEMY_SIZE, ENEMY_SIZE, 6);
    goomba.fillStyle(0x2f2018, 1);
    goomba.fillRect(6, 8, 6, 6);
    goomba.fillRect(ENEMY_SIZE - 12, 8, 6, 6);
    goomba.generateTexture('goomba-1', ENEMY_SIZE, ENEMY_SIZE);
    goomba.clear();
    goomba.fillStyle(0xe0a56a, 1);
    goomba.fillRoundedRect(0, 0, ENEMY_SIZE, ENEMY_SIZE, 6);
    goomba.fillStyle(0x2f2018, 1);
    goomba.fillRect(6, 10, 6, 6);
    goomba.fillRect(ENEMY_SIZE - 12, 10, 6, 6);
    goomba.generateTexture('goomba-2', ENEMY_SIZE, ENEMY_SIZE);
    goomba.destroy();

    const koopa = this.add.graphics();
    koopa.fillStyle(0x3dbf75, 1);
    koopa.fillRoundedRect(0, 0, ENEMY_SIZE, ENEMY_SIZE, 6);
    koopa.fillStyle(0x163823, 1);
    koopa.fillRect(6, 8, 6, 6);
    koopa.fillRect(ENEMY_SIZE - 12, 8, 6, 6);
    koopa.generateTexture('koopa-1', ENEMY_SIZE, ENEMY_SIZE);
    koopa.clear();
    koopa.fillStyle(0x54e697, 1);
    koopa.fillRoundedRect(0, 0, ENEMY_SIZE, ENEMY_SIZE, 6);
    koopa.fillStyle(0x163823, 1);
    koopa.fillRect(6, 10, 6, 6);
    koopa.fillRect(ENEMY_SIZE - 12, 10, 6, 6);
    koopa.generateTexture('koopa-2', ENEMY_SIZE, ENEMY_SIZE);
    koopa.destroy();

    const mushroom = this.add.graphics();
    mushroom.fillStyle(0xf75a6f, 1);
    mushroom.fillRoundedRect(0, 0, MUSHROOM_SIZE, MUSHROOM_SIZE, 6);
    mushroom.fillStyle(0xfff1f4, 1);
    mushroom.fillCircle(6, 6, 4);
    mushroom.fillCircle(14, 8, 4);
    mushroom.generateTexture('mushroom', MUSHROOM_SIZE, MUSHROOM_SIZE);
    mushroom.destroy();
  }

  protected placeBlock(x: number, y: number, type: BlockType): void {
    const textureKey = this.blockTextureForType(type);
    const block = this.blocks.create(x, y, textureKey) as Phaser.Physics.Arcade.Image;
    block.setData('block', { type } satisfies BlockData);
    block.setDepth(1);
  }

  protected blockTextureForType(type: BlockType): string {
    switch (type) {
      case BlockType.Powerup:
        return 'block-power';
      case BlockType.Smashable:
        return 'block-smash';
      case BlockType.Regular:
      default:
        return 'block';
    }
  }

  private spawnEnemies(): void {
    const walkFrameRate = 4;
    if (!this.anims.exists('goomba-walk')) {
      this.anims.create({
        key: 'goomba-walk',
        frames: [{ key: 'goomba-1' }, { key: 'goomba-2' }],
        frameRate: walkFrameRate,
        repeat: -1,
      });
    }
    if (!this.anims.exists('koopa-walk')) {
      this.anims.create({
        key: 'koopa-walk',
        frames: [{ key: 'koopa-1' }, { key: 'koopa-2' }],
        frameRate: walkFrameRate,
        repeat: -1,
      });
    }

    const positions = this.getEnemySpawns();
    positions.forEach((enemyData) => {
      const enemy = this.enemies.create(enemyData.x, enemyData.y, `${enemyData.type}-1`) as
        | Phaser.Physics.Arcade.Sprite
        | undefined;
      if (!enemy) {
        return;
      }
      enemy.setData('type', enemyData.type);
      enemy.setCollideWorldBounds(true);
      enemy.setBounce(1, 0);
      enemy.setVelocityX(ENEMY_SPEED * enemyData.dir);
      enemy.setSize(ENEMY_SIZE, ENEMY_SIZE);
      enemy.play(`${enemyData.type}-walk`);
    });
  }

  private handlePlayerBlockCollision(
    player: Phaser.Physics.Arcade.Sprite,
    block: Phaser.Physics.Arcade.Image,
  ): void {
    const hitCooldownMs = 140;
    const playerBody = player.body as Phaser.Physics.Arcade.Body;
    const blockBody = block.body as Phaser.Physics.Arcade.StaticBody;
    const blockData = block.getData('block') as BlockData | undefined;

    if (!blockData) {
      return;
    }

    const isHeadHit =
      playerBody.touching.up &&
      blockBody.touching.down &&
      playerBody.deltaY() < 0;
    if (!isHeadHit) {
      return;
    }

    const now = this.time.now;
    if (blockData.lastHitAt !== undefined && now - blockData.lastHitAt < hitCooldownMs) {
      return;
    }
    blockData.lastHitAt = now;

    if (blockData.type === BlockType.Powerup && !blockData.used) {
      blockData.used = true;
      block.setTexture('block');
      this.spawnMushroom(block.x, block.y - TILE_SIZE);
    }

    player.setVelocityY(PLAYER_BOUNCE_VELOCITY);

    if (blockData.type === BlockType.Smashable) {
      block.setData('block', blockData);
      block.disableBody(true, true);
      return;
    }

    block.setData('block', blockData);
    this.tweenBlock(block);
  }

  private handleEnemyBlockCollision(enemy: Phaser.Physics.Arcade.Sprite): void {
    this.setEnemyVelocityTowardPlayer(enemy);
  }

  private updateEnemyChase(): void {
    this.enemies.children.iterate((enemy) => {
      if (!enemy || !enemy.active) {
        return null;
      }
      this.setEnemyVelocityTowardPlayer(enemy as Phaser.Physics.Arcade.Sprite);
      return null;
    });
  }

  private setEnemyVelocityTowardPlayer(enemy: Phaser.Physics.Arcade.Sprite): void {
    const direction = Math.sign(this.player.x - enemy.x);
    if (direction === 0) {
      enemy.setVelocityX(0);
      return;
    }
    enemy.setVelocityX(ENEMY_SPEED * direction);
  }

  private handlePlayerMushroom(
    _player: Phaser.Physics.Arcade.Sprite,
    mushroom: Phaser.Physics.Arcade.Sprite,
  ): void {
    mushroom.destroy();
    this.tripState = applyMushroom(this.tripState);
    this.updateTripUI();
  }

  private handlePlayerEnemy(
    player: Phaser.Physics.Arcade.Sprite,
    enemy: Phaser.Physics.Arcade.Sprite,
  ): void {
    const stompVelocityThreshold = 80;
    const knockbackStrength = 160;
    const knockbackVertical = -200;
    const playerBody = player.body as Phaser.Physics.Arcade.Body;
    const enemyBody = enemy.body as Phaser.Physics.Arcade.Body;
    const stomp =
      playerBody.velocity.y > stompVelocityThreshold &&
      playerBody.touching.down &&
      enemyBody.touching.up;

    if (stomp) {
      enemy.destroy();
      player.setVelocityY(PLAYER_BOUNCE_VELOCITY);
      return;
    }

    if (!canTakeDamage(this.tripState, this.time.now)) {
      return;
    }

    this.tripState = applyDamage(this.tripState, this.time.now);
    this.updateTripUI();

    const knockback = player.x < enemy.x ? -knockbackStrength : knockbackStrength;
    player.setVelocity(knockback, knockbackVertical);
    this.triggerDamageFeedback();

    if (this.tripState.level < 0) {
      this.triggerGameOver('Trip level dropped below zero.');
    }
  }

  private spawnMushroom(x: number, y: number): void {
    const mushroomSpeed = 60;
    const mushroom = this.mushrooms.create(x, y, 'mushroom') as Phaser.Physics.Arcade.Sprite;
    mushroom.setBounce(1, 0);
    mushroom.setCollideWorldBounds(true);
    mushroom.setVelocityX(mushroomSpeed);
    mushroom.setSize(MUSHROOM_SIZE, MUSHROOM_SIZE);
    this.registerWorldObject(mushroom);
  }

  private setupHud(): void {
    this.uiLayer = this.add.layer();
    this.uiLayer.setDepth(100);
    this.cameras.main.ignore(this.uiLayer);

    this.uiCamera = this.cameras.add(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    this.uiCamera.setScroll(0, 0);
    this.refreshUiCameraMask();
  }

  private refreshUiCameraMask(): void {
    const uiObjects = new Set(this.uiLayer.list);
    const uiLayerObject = this.uiLayer as unknown as Phaser.GameObjects.GameObject;
    const ignoreList = this.children.list.filter(
      (child) => child !== uiLayerObject && !uiObjects.has(child),
    );
    this.uiCamera.ignore(ignoreList);
  }

  private addHudText(
    x: number,
    y: number,
    text: string,
    style: Phaser.Types.GameObjects.Text.TextStyle,
  ): Phaser.GameObjects.Text {
    const label = this.add.text(x, y, text, style);
    label.setScrollFactor(0);
    this.uiLayer.add(label);
    this.refreshUiCameraMask();
    return label;
  }

  private registerWorldObject(object: Phaser.GameObjects.GameObject): void {
    if (this.uiCamera) {
      this.uiCamera.ignore(object);
    }
  }

  private tweenBlock(block: Phaser.Physics.Arcade.Image): void {
    const bumpDistance = 8;
    const bumpDurationMs = 80;
    this.tweens.add({
      targets: block,
      y: block.y - bumpDistance,
      duration: bumpDurationMs,
      yoyo: true,
    });
  }

  private applyTripVisuals(time: number): void {
    const tripWobbleFactor = 0.016;
    const tripZoomFactor = 0.048;
    const level = Math.max(0, this.tripState.level);
    const tripIntensity = Math.pow(2, level) - 1 + level;

    const camera = this.cameras.main;
    const wobble = Math.sin(time / 240) * tripWobbleFactor * tripIntensity;
    const zoomPulse = Math.sin(time / 360) * tripZoomFactor * tripIntensity;
    camera.setRotation(wobble);
    camera.setZoom(1 + tripZoomFactor * tripIntensity + zoomPulse);

    const invuln = this.time.now - this.tripState.lastDamageAt < DAMAGE_COOLDOWN_MS;
    if (invuln) {
      const flicker = Math.sin(time / 80) > 0 ? 0.6 : 1;
      this.player.setAlpha(flicker);
    } else {
      this.player.setAlpha(1);
    }
  }

  private updateTripUI(): void {
    this.tripText.setText(`Trip Level: ${this.tripState.level}`);
  }

  private updatePlayerPose(isCrouching: boolean): void {
    if (isCrouching) {
      this.player.setTexture('player-crouch');
      this.player.setSize(PLAYER_WIDTH, PLAYER_CROUCH_HEIGHT);
      this.player.setOffset(PLAYER_OFFSET_X, PLAYER_CROUCH_OFFSET_Y);
      return;
    }
    this.player.setTexture('player');
    this.player.setSize(PLAYER_WIDTH, PLAYER_HEIGHT);
    this.player.setOffset(PLAYER_OFFSET_X, PLAYER_OFFSET_Y);
  }

  private updateJumpGauge(remaining: number, total: number): void {
    if (remaining === this.lastJumpGaugeRemaining && total === this.lastJumpGaugeTotal) {
      return;
    }

    const gaugeX = this.jumpLabel.x + 58;
    const gaugeY = this.jumpLabel.y + 2;
    const segmentWidth = 12;
    const segmentHeight = 10;
    const segmentGap = 4;
    const radius = 2;

    this.jumpGauge.clear();
    for (let index = 0; index < total; index += 1) {
      const isActive = index < remaining;
      const x = gaugeX + index * (segmentWidth + segmentGap);
      this.jumpGauge.fillStyle(isActive ? 0x79f2c0 : 0x3f3b46, 1);
      this.jumpGauge.fillRoundedRect(x, gaugeY, segmentWidth, segmentHeight, radius);
    }

    this.lastJumpGaugeRemaining = remaining;
    this.lastJumpGaugeTotal = total;
  }

  private triggerDamageFeedback(): void {
    const shakeDurationMs = 250;
    const shakeIntensity = 0.08;
    const flashDurationMs = 250;
    const red = 255;
    this.cameras.main.shake(shakeDurationMs, shakeIntensity);
    this.cameras.main.flash(flashDurationMs, red, 0, 0, false);
  }

  private triggerGameOver(reason: string): void {
    this.scene.start('GameOverScene', { reason });
  }
}
