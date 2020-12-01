import "phaser";
import { EventKeys } from "../Consts/EventKeys";
import { Utility } from "../Consts/Utility";
import { Bubble } from "./Bubble";

export class Tile extends Phaser.GameObjects.Rectangle
{
    private static readonly DEFAULT_WIDTH: number = 90;
    private static readonly DEFAULT_HEIGHT: number = 90;
    public static WIDTH: number;
    public static HEIGHT: number;

    row: number; // position in grid board
    column: number; // position in grid board
    bubble: Bubble;
    visited: boolean;

    constructor(scene: Phaser.Scene, row: number, column: number, rowheight: number, bubble: Bubble = null)
    {
        let x = column * Tile.WIDTH + Tile.WIDTH/2;
        if(row % 2)
            x += Tile.WIDTH/2;
        let y = row * rowheight;

        super(scene, x, y, Tile.WIDTH, Tile.HEIGHT);
        scene.add.existing(this);

        this.row = row;
        this.column = column;
        this.setBubble(bubble);
        this.setStrokeStyle(1, 0xffffff, 1);
    }

    public static calculateTileSize(scene: Phaser.Scene): void
    {
        Tile.WIDTH = Utility.getScaleByWidth(scene, Tile.DEFAULT_WIDTH);
        Tile.HEIGHT = Tile.WIDTH;
    }

    public setBubble(bubble: Bubble = null): void
    {
        this.bubble = bubble;
        if(bubble != null)
        {
            this.setFillStyle(0xffffff, 0.5);
            bubble.body.reset(this.x, this.y)
        }
        else
            this.setFillStyle();
    }

    public resetVisited(): void
    {
        this.visited = false;
    }

    public isEmpty(): boolean
    {
        return this.bubble == null;
    }
}
