import * as Phaser from 'phaser';

import {
  BlockType,
  DAMAGE_COOLDOWN_MS,
  ENEMY_SIZE,
  ENEMY_SPEED,
  EnemyType,
  MUSHROOM_SIZE,
  MUSHROOM_SPEED,
  PLAYER_BOUNCE_VELOCITY,
  PLAYER_HEIGHT,
  PLAYER_JUMP_VELOCITY,
  PLAYER_SPEED,
  PLAYER_WIDTH,
  SCREEN_HEIGHT,
  SCREEN_WIDTH,
  TILE_SIZE,
  TRIP_SCALE_STEP,
  TRIP_SPEED_STEP,
  TRIP_WOBBLE_FACTOR,
  TRIP_ZOOM_FACTOR,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from '../game/constants';
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

export abstract class WorldScene extends Phaser.Scene {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private player!: Phaser.Physics.Arcade.Sprite;
  private blocks!: Phaser.Physics.Arcade.StaticGroup;
  private enemies!: Phaser.Physics.Arcade.Group;
  private mushrooms!: Phaser.Physics.Arcade.Group;
  private tripState!: TripState;
  private tripText!: Phaser.GameObjects.Text;
  private uiCamera!: Phaser.Cameras.Scene2D.Camera;
  private uiLayer!: Phaser.GameObjects.Layer;
  private isCrouching = false;
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

    this.player = this.physics.add.sprite(160, 320, 'player');
    this.player.setCollideWorldBounds(true);
    this.player.setSize(PLAYER_WIDTH, PLAYER_HEIGHT);
    this.player.setOffset(3, 2);
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
    this.tripText = this.addHudText(16, 16, '', {
      fontFamily: 'Trebuchet MS',
      fontSize: '18px',
      color: '#f5f3ff',
    });
    this.updateTripUI();

    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
  }

  public update(time: number): void {
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const onGround = body.blocked.down;
    const tripLevel = Math.max(0, this.tripState.level);
    const maxExtraJumps = tripLevel;

    if (onGround && !this.wasOnGround) {
      this.jumpsUsed = 0;
    }

    this.isCrouching = this.cursors.down?.isDown === true && onGround;
    const speedScale = 1 + tripLevel * TRIP_SPEED_STEP;
    const baseSpeed = PLAYER_SPEED * speedScale;
    const moveSpeed = this.isCrouching ? baseSpeed * 0.35 : baseSpeed;

    if (!this.isCrouching && this.cursors.left?.isDown) {
      this.player.setVelocityX(-moveSpeed);
      this.player.setFlipX(true);
    } else if (!this.isCrouching && this.cursors.right?.isDown) {
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
      this.player.setVelocityY(PLAYER_JUMP_VELOCITY);
      this.jumpsUsed += 1;
    }

    this.wasOnGround = onGround;

    this.applyTripVisuals(time);
    this.updateEnemyChase();

    if (this.player.y > WORLD_HEIGHT + 200) {
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
    if (!this.anims.exists('goomba-walk')) {
      this.anims.create({
        key: 'goomba-walk',
        frames: [{ key: 'goomba-1' }, { key: 'goomba-2' }],
        frameRate: 4,
        repeat: -1,
      });
    }
    if (!this.anims.exists('koopa-walk')) {
      this.anims.create({
        key: 'koopa-walk',
        frames: [{ key: 'koopa-1' }, { key: 'koopa-2' }],
        frameRate: 4,
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
    if (blockData.lastHitAt !== undefined && now - blockData.lastHitAt < 140) {
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
    player: Phaser.Physics.Arcade.Sprite,
    mushroom: Phaser.Physics.Arcade.Sprite,
  ): void {
    mushroom.destroy();
    this.tripState = applyMushroom(this.tripState);
    this.updateTripUI();
    this.flashPlayer(player, 0x96ffda);
  }

  private handlePlayerEnemy(
    player: Phaser.Physics.Arcade.Sprite,
    enemy: Phaser.Physics.Arcade.Sprite,
  ): void {
    const playerBody = player.body as Phaser.Physics.Arcade.Body;
    const enemyBody = enemy.body as Phaser.Physics.Arcade.Body;
    const stomp = playerBody.velocity.y > 80 && playerBody.touching.down && enemyBody.touching.up;

    if (stomp) {
      enemy.destroy();
      player.setVelocityY(PLAYER_BOUNCE_VELOCITY);
      this.flashPlayer(player, 0xfff6b0);
      return;
    }

    if (!canTakeDamage(this.tripState, this.time.now)) {
      return;
    }

    this.tripState = applyDamage(this.tripState, this.time.now);
    this.updateTripUI();

    const knockback = player.x < enemy.x ? -160 : 160;
    player.setVelocity(knockback, -200);
    this.flashPlayer(player, 0xff8aa5);

    if (this.tripState.level < 0) {
      this.triggerGameOver('Trip level dropped below zero.');
    }
  }

  private spawnMushroom(x: number, y: number): void {
    const mushroom = this.mushrooms.create(x, y, 'mushroom') as Phaser.Physics.Arcade.Sprite;
    mushroom.setBounce(1, 0);
    mushroom.setCollideWorldBounds(true);
    mushroom.setVelocityX(MUSHROOM_SPEED);
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
    this.tweens.add({
      targets: block,
      y: block.y - 8,
      duration: 80,
      yoyo: true,
    });
  }

  private applyTripVisuals(time: number): void {
    const level = Math.max(0, this.tripState.level);
    const scale = 1 + level * TRIP_SCALE_STEP;
    this.player.setScale(scale);

    const camera = this.cameras.main;
    const wobble = Math.sin(time / 240) * TRIP_WOBBLE_FACTOR * level;
    const zoomPulse = Math.sin(time / 360) * TRIP_ZOOM_FACTOR * level;
    camera.setRotation(wobble);
    camera.setZoom(1 + level * TRIP_ZOOM_FACTOR + zoomPulse);

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

  private flashPlayer(player: Phaser.Physics.Arcade.Sprite, tint: number): void {
    player.setTint(tint);
    this.time.delayedCall(180, () => player.clearTint());
  }

  private triggerGameOver(reason: string): void {
    this.scene.start('GameOverScene', { reason });
  }
}
