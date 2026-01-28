import * as Phaser from 'phaser';

import { SCREEN_HEIGHT, SCREEN_WIDTH } from '../game/constants';

type GameOverData = {
  reason?: string;
};

export class GameOverScene extends Phaser.Scene {
  public constructor() {
    super('GameOverScene');
  }

  public create(data: GameOverData): void {
    this.addBackground();

    const title = this.add.text(SCREEN_WIDTH / 2, 160, 'Trip Over', {
      fontFamily: 'Trebuchet MS',
      fontSize: '44px',
      color: '#ffefff',
    });
    title.setOrigin(0.5, 0.5);

    const reason = data.reason ?? 'Trip level dropped below zero.';
    const body = this.add.text(SCREEN_WIDTH / 2, 250, reason, {
      fontFamily: 'Trebuchet MS',
      fontSize: '20px',
      color: '#d8d1ff',
      align: 'center',
    });
    body.setOrigin(0.5, 0.5);

    const hint = this.add.text(SCREEN_WIDTH / 2, 360, 'Press Enter to restart', {
      fontFamily: 'Trebuchet MS',
      fontSize: '18px',
      color: '#8cf6ff',
    });
    hint.setOrigin(0.5, 0.5);

    const keyboard = this.input.keyboard;
    if (!keyboard) {
      return;
    }

    keyboard.once('keydown-ENTER', () => {
      this.scene.start('World1Scene');
    });
  }

  private addBackground(): void {
    const gradient = this.add.graphics();
    gradient.fillGradientStyle(0x1b0d1d, 0x0b0e1c, 0x2b152a, 0x0a0a10, 1);
    gradient.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    const glow = this.add.graphics();
    glow.fillStyle(0x592446, 0.3);
    glow.fillCircle(220, 180, 180);
    glow.fillStyle(0x23365f, 0.2);
    glow.fillCircle(720, 200, 220);
  }
}
