import * as Phaser from 'phaser';

import { SCREEN_HEIGHT, SCREEN_WIDTH } from '../game/constants';

export class StartScene extends Phaser.Scene {
  public constructor() {
    super('StartScene');
  }

  public create(): void {
    this.addBackground();

    const title = this.add.text(SCREEN_WIDTH / 2, 120, 'Psychedelic Plumber', {
      fontFamily: 'Trebuchet MS',
      fontSize: '42px',
      color: '#f7f2ff',
    });
    title.setOrigin(0.5, 0.5);

    const instructions = [
      'Arrow keys: Move / Jump / Crouch',
      'Bump power blocks for mushrooms',
      'Smash cracked blocks from below',
      'Avoid enemies or stomp them',
      '',
      'Run: npm install',
      'Start: npm run dev',
      '',
      'Press SPACE to begin',
    ];

    const body = this.add.text(SCREEN_WIDTH / 2, 260, instructions, {
      fontFamily: 'Trebuchet MS',
      fontSize: '20px',
      color: '#d8d1ff',
      align: 'center',
      lineSpacing: 8,
    });
    body.setOrigin(0.5, 0.5);

    const hint = this.add.text(SCREEN_WIDTH / 2, 440, 'Space or Enter', {
      fontFamily: 'Trebuchet MS',
      fontSize: '18px',
      color: '#8cf6ff',
    });
    hint.setOrigin(0.5, 0.5);

    const keyboard = this.input.keyboard;
    if (!keyboard) {
      return;
    }

    keyboard.once('keydown-SPACE', () => {
      this.scene.start('World1Scene');
    });
    keyboard.once('keydown-ENTER', () => {
      this.scene.start('World1Scene');
    });
  }

  private addBackground(): void {
    const gradient = this.add.graphics();
    gradient.fillGradientStyle(0x141124, 0x19162f, 0x1b1539, 0x0d0a1a, 1);
    gradient.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    const glow = this.add.graphics();
    glow.fillStyle(0x3b2b6c, 0.35);
    glow.fillCircle(160, 140, 160);
    glow.fillStyle(0x1d5b88, 0.25);
    glow.fillCircle(760, 120, 200);
    glow.fillStyle(0x6b1b3d, 0.2);
    glow.fillCircle(520, 420, 220);
  }
}
