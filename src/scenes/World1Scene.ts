import { BlockType, EnemyType, TILE_SIZE, SCREEN_WIDTH, SCREEN_HEIGHT, WORLD_HEIGHT, WORLD_WIDTH } from '../game/constants';
import { WorldScene } from './WorldScene';

// TODO: can't all these protected methods be one? especially buildLevel and getEnemySpawns?
export class World1Scene extends WorldScene {
  public constructor() {
    super('World1Scene');
  }

  protected addBackground(): void {
    // TODO: set scroll factor on these graphics objects so they parallax properly (0.2 and 0.3 respectively)
    // but need to make the backcground cover the whole world width then
    const gradient = this.add.graphics();
    gradient.fillGradientStyle(0x120d1d, 0x191b35, 0x1c1330, 0x0b0a16, 1);
    gradient.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    gradient.setScrollFactor(0);

    const halo = this.add.graphics();
    halo.fillStyle(0x2e5e90, 0.25);
    halo.fillCircle(220, 120, 180);
    halo.fillStyle(0x6a2c52, 0.2);
    halo.fillCircle(720, 80, 200);
    halo.setScrollFactor(0);
  }

  protected buildLevel(): void {
    const groundY = WORLD_HEIGHT - TILE_SIZE / 2;
    for (let x = 0; x <= WORLD_WIDTH; x += TILE_SIZE) {
      this.placeBlock(x + TILE_SIZE / 2, groundY, BlockType.Regular);
    }

    const platforms: Array<{ x: number; y: number; count: number }> = [
      { x: 360, y: 380, count: 5 },
      { x: 820, y: 320, count: 4 },
      { x: 1160, y: 260, count: 4 },
      { x: 1560, y: 360, count: 6 },
      { x: 2100, y: 300, count: 5 },
    ];

    platforms.forEach((platform, platformIndex) => {
      for (let blockIndex = 0; blockIndex < platform.count; blockIndex += 1) {
        this.placeBlock(
          platform.x + blockIndex * TILE_SIZE,
          platform.y,
          platformIndex % 2 === 0 || blockIndex === 2 
            ? BlockType.Powerup 
            : BlockType.Regular,
        );
      }
    });

    this.placeBlock(560, 320, BlockType.Smashable);
    this.placeBlock(592, 320, BlockType.Smashable);
    this.placeBlock(624, 320, BlockType.Smashable);
    this.placeBlock(1880, 320, BlockType.Smashable);

    this.placeBlock(2450, 420, BlockType.Powerup);
    this.placeBlock(2482, 420, BlockType.Regular);
    this.placeBlock(2514, 420, BlockType.Powerup);
  }

  protected getEnemySpawns(): Array<{ x: number; y: number; type: EnemyType; dir: number }> {
    return [
      { x: 520, y: 420, type: EnemyType.Goomba, dir: -1 },
      { x: 980, y: 420, type: EnemyType.Koopa, dir: 1 },
      { x: 1460, y: 420, type: EnemyType.Goomba, dir: 1 },
      { x: 1960, y: 420, type: EnemyType.Koopa, dir: -1 },
      { x: 2300, y: 420, type: EnemyType.Goomba, dir: -1 },
    ];
  }
}
