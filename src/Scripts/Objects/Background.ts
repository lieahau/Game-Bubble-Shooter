import "phaser";
import { BackgroundColors } from "../Consts/Colors";
import { Board } from "./Board";

export class Background
{
    public header: Phaser.GameObjects.Rectangle;
    public playArea: Phaser.GameObjects.Rectangle;
    public footer: Phaser.GameObjects.Rectangle;

    constructor(scene: Phaser.Scene, rowheight: number)
    {
        let playAreaHeight: number = rowheight * Board.ROWS;
        let headerHeight: number = (scene.cameras.main.height - playAreaHeight) / 3;
        let footerHeight: number = scene.cameras.main.height - headerHeight - playAreaHeight;

        this.header = scene.add.rectangle(
            0,
            0,
            scene.cameras.main.width,
            headerHeight
        ).setOrigin(0, 0).setFillStyle(BackgroundColors.DarkBlue).setDepth(-1);
        
        this.playArea = scene.add.rectangle(
            0,
            this.header.height,
            scene.cameras.main.width,
            playAreaHeight
        ).setOrigin(0, 0).setFillStyle(BackgroundColors.Gray).setDepth(-1);
        
        this.footer = scene.add.rectangle(
            0,
            headerHeight + playAreaHeight,
            scene.cameras.main.width,
            footerHeight
        ).setOrigin(0, 0).setFillStyle(BackgroundColors.DarkGray).setDepth(-1);
    }
}
