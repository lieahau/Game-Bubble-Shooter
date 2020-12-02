import "phaser";
import { EventKeys } from "../Consts/EventKeys";
import { TextureKeys } from "../Consts/TextureKeys";
import { Utility } from "../Consts/Utility";

export class PanelEndGame
{
    scene: Phaser.Scene;
    panel: Phaser.GameObjects.Image;
    resultText: Phaser.GameObjects.Text;
    replayButton: Phaser.GameObjects.Image;

    constructor(scene: Phaser.Scene, x: number, y: number)
    {
        this.scene = scene;
        this.panel = scene.add.image(x, y, TextureKeys.Panel);
        this.panel.setDisplaySize(Utility.getScreenWidthByPercentage(scene, 0.75), Utility.getScreenHeightByPercentage(scene, 0.4));
        this.panel.setDepth(1);
        
        this.resultText = scene.add.text(
            x,
            y - (this.panel.displayHeight/2) + (this.panel.displayHeight*0.15),
            "Game Over",
            {
                font: Utility.getScaleByWidth(scene, 48).toString() + "px Arial",
                fill: "#FFFFFF",
                align: "center"
            }
        ).setOrigin(0.5).setDepth(2);

        this.replayButton = scene.add.image(x, y + (this.panel.displayWidth/2*0.1), TextureKeys.ReplayButton);
        this.replayButton.setDisplaySize(this.panel.displayWidth/3, this.panel.displayWidth/3);
        this.replayButton.setDepth(2);
        
        this.panel.setVisible(false);
        this.resultText.setVisible(false);
        this.replayButton.setVisible(false);

        scene.events.on(EventKeys.ENDGAME, this.displayPanel, this)
    }

    private displayPanel(args?: any)
    {
        this.panel.setVisible(true);
        this.resultText.setVisible(true);
        this.replayButton.setVisible(true);

        let str: string = (args.isWin) ? "Win" : "Game Over";
        this.resultText.setText(str);

        this.replayButton.setInteractive({
            hitArea: new Phaser.Geom.Circle(this.replayButton.width/2, this.replayButton.height/2, this.replayButton.width/2),
            hitAreaCallback: Phaser.Geom.Circle.Contains,
        }).on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, function(pointer){
            Object.values(EventKeys).forEach((value) => {
                this.scene.events.off(value);
            }, this);
            this.scene.scene.restart();
        }, this);
    }
}