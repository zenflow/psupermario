import * as Phaser from 'phaser';

import { SCREEN_HEIGHT, SCREEN_WIDTH } from './game/constants';
import { GameOverScene } from './scenes/GameOverScene';
import { StartScene } from './scenes/StartScene';
import { World1Scene } from './scenes/World1Scene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'app',
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  backgroundColor: '#0e0d13',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 900 },
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [StartScene, World1Scene, GameOverScene],
};

new Phaser.Game(config);
