import "phaser";
import { Tile } from "./Tile";
import { BubbleColors, randomEnum } from "../Consts/Colors";
import { AnimationKeys } from "../Consts/AnimationKeys";
import { TextureKeys } from "../Consts/TextureKeys";
import { BubbleManager } from "../Managers/BubbleManager";
import { EventKeys } from "../Consts/EventKeys";

export class Bubble extends Phaser.Physics.Arcade.Sprite
{
    color: BubbleColors;
    isPlayer: boolean;
    isCollisionEnter: boolean;

    constructor(scene: Phaser.Scene, x: number, y: number, texture: string | Phaser.Textures.Texture, frame?: string | integer, color?: BubbleColors)
    {
        super(scene, x, y, texture, frame);
        scene.add.existing(this);
        scene.physics.world.enable(this);

        this.reset(frame);
        this.color = (color) ? color : BubbleColors.None;
        this.setTint(color);
        this.setPlayer(false);

        scene.anims.create({
            key: AnimationKeys.DESTROYBUBBLE,
            frames: scene.anims.generateFrameNumbers(TextureKeys.Bubble, { start: 0, end: 5 }),
            frameRate: 5,
        });

        this.on(Phaser.Animations.Events.SPRITE_ANIMATION_KEY_COMPLETE + AnimationKeys.DESTROYBUBBLE, this.onAnimCompleteDestroy, this);
    }

    public OnCollisionEnter(): void
    {
        if(this.isCollisionEnter)
            return;
        
        this.isCollisionEnter = true;
    }

    public OnCollisionExit(): void
    {
        this.isCollisionEnter = false;
    }

    public reset(frame: string | integer = 0): void
    {
        this.setFrame(frame, false, false);
        this.setDisplaySize(Tile.WIDTH*1.5, Tile.HEIGHT*1.5);

        this.setBodySize(this.width/1.5, this.height/1.5);
        this.body.setCircle(this.width/3);
        
        this.OnCollisionExit();
    }

    public setColor(color: BubbleColors): void
    {
        this.color = color;
        this.setTint(color);
    }

    public setRandomColor(exclude: BubbleColors[] = [BubbleColors.None]): void
    {
        let color: BubbleColors = randomEnum(BubbleColors, exclude);
        this.setColor(color);
    }

    public setPlayer(val: boolean = true): void
    {
        this.isPlayer = val;
        if(val)
        {
            this.setBounce(1);
            this.setImmovable(false);
        }
        else
        {
            this.setBounce(0);
            this.setImmovable(true);
            this.setVelocity(0, 0);
        }
    }

    public playAnimDestroy(): void
    {
        this.refreshBody();
        this.disableBody();
        this.anims.play(AnimationKeys.DESTROYBUBBLE, true);
    }

    public onAnimCompleteDestroy(animation: Phaser.Animations.Animation, frame: Phaser.Animations.AnimationFrame): void
    {
        this.scene.events.emit(EventKeys.DESPAWNBUBBLE, this);
    }

    playAnimFallen(): void
    {
        this.setVelocityY(1000);
        this.scene.time.addEvent({
            delay: 500,
            callback: () =>
            {
                this.setVelocity(0, 0);
                this.scene.events.emit(EventKeys.DESPAWNBUBBLE, this);
            }
        });
    }
}