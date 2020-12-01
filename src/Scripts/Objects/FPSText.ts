import "phaser";
import { Utility } from "../Consts/Utility";

export class FPSText extends Phaser.GameObjects.Text
{
    private static readonly prefix: string = "FPS: ";

    constructor(scene: Phaser.Scene)
    {
        super(
            scene,
            Utility.getScreenWidthByPercentage(scene, 0.01), 
            Utility.getScreenHeightByPercentage(scene, 0.95),
            FPSText.prefix + Math.round(scene.game.loop.actualFps),
            {
                fontFamily: "Arial",
                fontSize: Utility.getScaleByWidth(scene, 24).toString() + "px",
                color: "#FFFFFF"
            }
        );
        scene.add.existing(this);

        scene.time.addEvent({
            loop: true,
            callback: () => {
                this.setText(FPSText.prefix + Math.round(scene.game.loop.actualFps));
            }
        });
    }
}