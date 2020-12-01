import "phaser";

export class Boundary
{
    left: Phaser.GameObjects.Rectangle;
    top: Phaser.GameObjects.Rectangle;
    right: Phaser.GameObjects.Rectangle;

    constructor(scene: Phaser.Scene, x1: number, y1: number, w1: number, h1: number, x2: number, y2: number, w2: number, h2: number, x3: number, y3: number, w3: number, h3: number)
    {
        this.left = scene.add.rectangle(x1, y1, w1, h1).setOrigin(0, 0);
        this.top = scene.add.rectangle(x2, y2, w2, h2).setOrigin(0, 0);
        this.right = scene.add.rectangle(x3, y3, w3, h3).setOrigin(0, 0);

        scene.physics.world.enable(this.left);
        scene.physics.world.enable(this.top);
        scene.physics.world.enable(this.right);

        (this.left.body as Phaser.Physics.Arcade.Body).setImmovable(true);
        (this.top.body as Phaser.Physics.Arcade.Body).setImmovable(true);
        (this.right.body as Phaser.Physics.Arcade.Body).setImmovable(true);
    }

}