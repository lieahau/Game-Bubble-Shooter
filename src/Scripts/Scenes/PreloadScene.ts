import "phaser";
import { SceneKeys } from "../Consts/SceneKeys";
import { TextureKeys } from "../Consts/TextureKeys";
import { AudioKeys } from "../Consts/AudioKeys";

export class PreloadScene extends Phaser.Scene
{
    constructor()
    {
        super({ key: SceneKeys.Preload });
    }

    preload(): void
    {
        this.load.path = "src/Assets/";
        this.load.image(TextureKeys.Panel, "Panel.png");
        this.load.image(TextureKeys.Arrow, "arrow.png");
        this.load.image(TextureKeys.ReplayButton, "Replay.png");
        this.load.spritesheet(TextureKeys.Bubble, "bubblesprite.png", { frameWidth: 180, frameHeight: 180 });

        this.load.audio(AudioKeys.Shoot, "Audios/Blop.mp3");
    }
  
    create(): void
    {
        this.scene.start(SceneKeys.Game);
    }
};
