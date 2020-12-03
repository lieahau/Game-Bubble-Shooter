import "phaser";
import { Bubble } from "./Bubble";
import { Tile } from "./Tile";
import { Boundary } from "./Boundary";
import { BubbleManager } from "../Managers/BubbleManager";
import { BubbleColors } from "../Consts/Colors";
import { TextureKeys } from "../Consts/TextureKeys";
import { EventKeys } from "../Consts/EventKeys";
import { Utility } from "../Consts/Utility";

enum InputState
{
    None,
    Start,
    Drag,
    End
};

export class Player
{
    scene: Phaser.Scene;
    
    private arrowHint: Phaser.GameObjects.Image;
    private lineHint: Phaser.Geom.Line;
    private graphics: Phaser.GameObjects.Graphics;

    private shootPath: Phaser.Geom.Line;
    private shootReflectPath: Phaser.Geom.Line;
    private shootIntersectPoint: Phaser.Geom.Point;
    private shootIntersectReflectPoint: Phaser.Geom.Point;
    private tempCircle: Phaser.Geom.Circle;

    x: number;
    y: number;
    private boundary: Boundary;
    bubble: Bubble;
    private angle: number;
    inputState: InputState;
    touchArea: Phaser.Geom.Rectangle;

    private static readonly MAX_SPEED: number = 4000;
    private static readonly DEFAULT_SPEED: number = 3000;

    bubbleManager: BubbleManager;
    private bubbleColliders: Phaser.Physics.Arcade.Collider[];

    constructor(scene: Phaser.Scene, x: number, y: number, bubbleManager: BubbleManager, boundary: Boundary, touchArea: Phaser.Geom.Rectangle)
    {
        this.scene = scene;
        
        this.arrowHint = scene.add.image(x, y, TextureKeys.Arrow).setVisible(false);
        this.arrowHint.setDisplaySize(Tile.WIDTH*3, Tile.HEIGHT*3).setTint(0xaa0000).setDepth(1);
        this.lineHint = new Phaser.Geom.Line();
        this.graphics = scene.add.graphics().setDefaultStyles(
            { lineStyle: { width: Utility.getScaleByWidth(scene, 5), color: 0xffffff, alpha: 1 } }
        ).setDepth(2);

        this.shootPath = new Phaser.Geom.Line();
        this.shootReflectPath = new Phaser.Geom.Line();
        this.shootIntersectPoint = new Phaser.Geom.Point();
        this.shootIntersectReflectPoint = new Phaser.Geom.Point();
        this.tempCircle = new Phaser.Geom.Circle();

        this.x = x;
        this.y = y;
        this.bubbleManager = bubbleManager;
        this.boundary = boundary;

        this.angle = Phaser.Math.DegToRad(-90);
        this.inputState = InputState.None;

        this.touchArea = touchArea;
        scene.events.on(EventKeys.NEXTBUBBLE, this.setRandomBubble, this);
    }

    public setRandomBubble(args?: any): void
    {
        let availableColors: Partial<Record<BubbleColors, number>> = args.colorsCount;
        this.bubble = this.bubbleManager.spawn(this.x, this.y);
        
        let excludeColors: BubbleColors[] = [];
        Object.keys(availableColors).forEach(function(key){
            if(availableColors[key] == 0)
                excludeColors.push(Number(key) as BubbleColors);
        });
        this.bubble.setRandomColor(excludeColors);

        this.bubble.setPlayer();
        this.addBubbleCollider();

        this.tempCircle.setTo(0, 0, this.bubble.width/2);
        this.inputState = InputState.None;

        this.graphics.setInteractive({
            hitArea: this.touchArea,
            hitAreaCallback: Phaser.Geom.Rectangle.Contains,
            draggable: true
        }).on(Phaser.Input.Events.GAMEOBJECT_DRAG_START, this.onDragStart, this)
        .on(Phaser.Input.Events.GAMEOBJECT_DRAG, this.onDrag, this)
        .on(Phaser.Input.Events.GAMEOBJECT_DRAG_END, this.onDragEnd, this);
    }

    private addBubbleCollider(): void
    {
        let bubble = this.bubble;
        this.bubbleColliders = [];
        this.bubbleColliders.push(this.scene.physics.add.collider(bubble, this.boundary.left));
        this.bubbleColliders.push(this.scene.physics.add.collider(bubble, this.boundary.right));

        this.bubbleColliders.push(this.scene.physics.add.collider(
            bubble, this.boundary.top, (shootedBubble: Bubble, boundary: Phaser.GameObjects.Rectangle) =>
            {
                this.onBubbleCollide(shootedBubble);
                this.scene.events.emit(EventKeys.BUBBLECOLLIDE,
                {
                    "shootedBubble": shootedBubble,
                    "collideWithGroup": false
                });
            }, () => { return !bubble.isCollisionEnter }, this)
        );

        this.bubbleColliders.push(this.scene.physics.add.collider(
            bubble, this.bubbleManager, (shootedBubble: Bubble, collidedBubble: Bubble) =>
            {
                this.onBubbleCollide(shootedBubble);
                this.scene.events.emit(EventKeys.BUBBLECOLLIDE, 
                {
                    "shootedBubble": shootedBubble,
                    "collidedBubble": collidedBubble,
                    "collideWithGroup": true
                });
            }, () => { return !bubble.isCollisionEnter }, this)
        );
    }

    private onBubbleCollide(shootedBubble: Bubble): void
    {
        shootedBubble.OnCollisionEnter();
        shootedBubble.setPlayer(false);
        this.bubbleColliders.forEach(function(collider)
        {
            this.scene.physics.world.removeCollider(collider);
        }, this);
        this.bubbleColliders = [];
    }

    private getAngle(pointer: Phaser.Input.Pointer)
    {
        let inputAngle = Phaser.Math.Angle.Between(pointer.x, pointer.y, this.bubble.body.x, this.bubble.body.y);
        if(inputAngle > 0)
        {
            return inputAngle;
        }
        inputAngle = Phaser.Math.Clamp(inputAngle, Phaser.Math.DegToRad(-170), Phaser.Math.DegToRad(-10));
        return inputAngle;   
    }

    private onDragStart(pointer: Phaser.Input.Pointer): void
    {
        // not ready for input
        if(this.inputState != InputState.None)
            return;
 
        let inputAngle = this.getAngle(pointer);
        this.angle = inputAngle;
        this.arrowHint.setVisible(true);
        this.drawHint(pointer, this.angle);
        this.inputState = InputState.Start;
    }

    private onDrag(pointer: Phaser.Input.Pointer): void
    {
        if(this.inputState == InputState.None || this.inputState == InputState.End)
            return;
    
        // get input angle
        let inputAngle = this.getAngle(pointer);

        if(inputAngle > 0)
        {
            // cancel input
            this.clearHint();
            this.inputState = InputState.None;
            return;
        }

        // update data
        this.angle = inputAngle;
        this.inputState = InputState.Drag;

        // draw hint
        this.drawHint(pointer, this.angle);
    }

    private onDragEnd(pointer: Phaser.Input.Pointer): void
    {
        this.clearHint();
        if(this.inputState != InputState.Drag)
        {
            this.inputState = InputState.None;
            return;
        }
        
        this.inputState = InputState.End;
        let speed = Utility.getScaleByWidth(this.scene, Player.DEFAULT_SPEED);
        speed = (speed > Player.MAX_SPEED) ? Player.MAX_SPEED : speed;
        this.scene.physics.velocityFromRotation(this.angle, speed, this.bubble.body.velocity);

        this.graphics.removeInteractive();
        this.graphics.off(Phaser.Input.Events.GAMEOBJECT_DRAG_START);
        this.graphics.off(Phaser.Input.Events.GAMEOBJECT_DRAG);
        this.graphics.off(Phaser.Input.Events.GAMEOBJECT_DRAG_END);
    }

    private drawHint(pointer: Phaser.Input.Pointer, inputAngle: number): void
    {
        let topBound: Phaser.Geom.Line = this.boundary.top.getBounds().getLineC();

        let adjustXBound: number = this.bubble.body.radius * this.bubble.scale;
        let leftBound: Phaser.Geom.Line = new Phaser.Geom.Line();
        leftBound = Object.assign(leftBound, this.boundary.left.getBounds().getLineB());
        leftBound.x1 += adjustXBound;
        leftBound.x2 += adjustXBound;

        let rightBound: Phaser.Geom.Line = new Phaser.Geom.Line();
        rightBound = Object.assign(rightBound, this.boundary.right.getBounds().getLineD());
        rightBound.x1 -= adjustXBound;
        rightBound.x2 -= adjustXBound;

        /* set arrow angle */
        this.arrowHint.setAngle(Phaser.Math.RadToDeg(inputAngle+Phaser.Math.DegToRad(90)));

        /* set line hint angle */
        let length: number = Phaser.Math.Distance.BetweenPoints(this.arrowHint, pointer);
        let angle: number = inputAngle+Phaser.Math.DegToRad(180);
        Phaser.Geom.Line.SetToAngle(this.lineHint, this.arrowHint.x, this.arrowHint.y, angle, length);
        this.graphics.clear().strokeLineShape(this.lineHint);

        /* set shoot path */
        Phaser.Geom.Line.SetToAngle(this.shootPath, this.arrowHint.x, this.arrowHint.y, inputAngle, this.scene.cameras.main.height);
        
        let isIntersectSideBoundary: boolean = false;
        let isIntersectBubble: boolean = false;
        let sideBound: Phaser.Geom.Line = (inputAngle < Phaser.Math.DegToRad(-90)) ? leftBound : rightBound;

        if(Phaser.Geom.Intersects.LineToLine(this.shootPath, sideBound, this.shootIntersectPoint)) // intersect with left or right boundary
            isIntersectSideBoundary = true;
        else
            Phaser.Geom.Intersects.LineToLine(this.shootPath, topBound, this.shootIntersectPoint) // intersect with top boundary

        isIntersectBubble = this.findIntersectLineToBubble(this.shootPath, this.shootIntersectPoint, inputAngle, false);

        length = Phaser.Math.Distance.BetweenPoints(this.arrowHint, this.shootIntersectPoint);
        Phaser.Geom.Line.SetToAngle(this.shootPath, this.arrowHint.x, this.arrowHint.y, inputAngle, length);

        /* set shoot recflected path */
        if(isIntersectSideBoundary && !isIntersectBubble)
        {
            let reflectAngle: number = Phaser.Geom.Line.ReflectAngle(this.shootPath, sideBound);
            length = this.scene.cameras.main.height;
            Phaser.Geom.Line.SetToAngle(this.shootReflectPath, this.shootIntersectPoint.x, this.shootIntersectPoint.y, reflectAngle, length);

            let reflectBoundary: Phaser.Geom.Line = (inputAngle < Phaser.Math.DegToRad(-90)) ? rightBound : leftBound;
            if(!Phaser.Geom.Intersects.LineToLine(this.shootReflectPath, reflectBoundary, this.shootIntersectReflectPoint))
                Phaser.Geom.Intersects.LineToLine(this.shootReflectPath, topBound, this.shootIntersectReflectPoint);

            this.findIntersectLineToBubble(this.shootReflectPath, this.shootIntersectReflectPoint, inputAngle, true);

            length = Phaser.Math.Distance.BetweenPoints(this.shootIntersectPoint, this.shootIntersectReflectPoint);
            Phaser.Geom.Line.SetToAngle(this.shootReflectPath, this.shootIntersectPoint.x, this.shootIntersectPoint.y, reflectAngle, length);

            this.drawDottedLine(this.shootReflectPath);
        }

        this.drawDottedLine(this.shootPath)
    }

    private drawDottedLine(line: Phaser.Geom.Line)
    {
        let points: Phaser.Geom.Point[] = line.getPoints(0, Utility.getScaleByWidth(this.scene, 30));
        this.graphics.fillStyle(0xffffff, 1);
        for (var i = 0; i < points.length; i++)
        {
            this.graphics.fillCircle(points[i].x, points[i].y, Utility.getScaleByWidth(this.scene, 5));
        }
    }

    private findIntersectLineToBubble(line: Phaser.Geom.Line, intersectPoint: Phaser.Geom.Point, inputAngle: number, reflecting: boolean): boolean
    {
        let isIntersectBubble: boolean = false;
        this.bubbleManager.getChildren().forEach(function(child: Bubble)
        {
            if(!child.visible || child.isPlayer)
                return;
            
            this.tempCircle.setPosition(child.x, child.y);
            let tempIntersects = Phaser.Geom.Intersects.GetLineToCircle(line, this.tempCircle);
            if(tempIntersects.length > 0)
            {
                if(tempIntersects[0].y > intersectPoint.y)
                {
                    if(inputAngle < Phaser.Math.DegToRad(-90))
                    {
                        // shoot left (find most right bubble) or reflect right (find most left bubble)
                        if((!reflecting && tempIntersects[0].x > intersectPoint.x) || (reflecting && tempIntersects[0].x < intersectPoint.x))
                        {
                            isIntersectBubble = true;
                            intersectPoint.setTo(tempIntersects[0].x, tempIntersects[0].y);
                        }
                    }
                    else if(inputAngle == Phaser.Math.DegToRad(-90))
                    {
                        // shoot straight, select any the most bottom intersect point with bubble
                        isIntersectBubble = true;
                        intersectPoint.setTo(tempIntersects[0].x, tempIntersects[0].y);
                    }
                    else if((!reflecting && tempIntersects[0].x < intersectPoint.x) || (reflecting && tempIntersects[0].x > intersectPoint.x))
                    {
                        // shoot right (find most left bubble) or reflect left (find most right bubble)
                        isIntersectBubble = true;
                        intersectPoint.setTo(tempIntersects[0].x, tempIntersects[0].y);
                    }
                }
            }
        }, this);

        return isIntersectBubble;
    }

    private clearHint(): void
    {
        this.arrowHint.setVisible(false);
        this.graphics.clear();
    }
}
