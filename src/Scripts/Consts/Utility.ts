import "phaser";

export class Utility
{
    private static readonly DEFAULT_HEIGHT: number = 1080;
    private static readonly DEFAULT_WIDTH: number = 720;
    private static readonly DEFAULT_RATIO: number = 1080 / 720;

    private constructor(){}

    public static getScreenWidthByPercentage(scene: Phaser.Scene, percentage?: number): number
    {
        if(!percentage)
            percentage = 1;
        return scene.cameras.main.width * percentage;
    }

    public static getScreenHeightByPercentage(scene: Phaser.Scene, percentage?: number): number
    {
        if(!percentage)
            percentage = 1;
        return scene.cameras.main.height * percentage;
    }

    public static getScaleByWidth(scene: Phaser.Scene, default_scale?: number): number
    {
        if(!default_scale)
            default_scale = 1;
        return scene.cameras.main.width / Utility.DEFAULT_WIDTH * default_scale;
    }

    public static getScaleByHeight(scene: Phaser.Scene, default_scale?: number): number
    {
        if(!default_scale)
            default_scale = 1;
        return scene.cameras.main.height / Utility.DEFAULT_HEIGHT * default_scale;
    }
}