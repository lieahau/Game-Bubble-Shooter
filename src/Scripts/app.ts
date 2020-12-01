import "phaser";
import { PreloadScene } from "./Scenes/PreloadScene";
import { GameScene } from "./Scenes/GameScene";

const config: Phaser.Types.Core.GameConfig = {
  title: "Bubble Shooter",
  width: 720,
  height: 1080,
  scale: {
      mode: Phaser.Scale.FIT, // Fit to window
      autoCenter: Phaser.Scale.CENTER_BOTH // Center vertically and horizontally
  },
  parent: "game",
  scene: [PreloadScene, GameScene],
  physics: {
    default: "arcade",
    arcade: {
      debug: false
    }
  },
  backgroundColor: "#000033"
};

export class BubbleShooter extends Phaser.Game {
  constructor(config: Phaser.Types.Core.GameConfig) {
    super(config);
  }
}

window.onload = () => {
  var game = new BubbleShooter(config);
};