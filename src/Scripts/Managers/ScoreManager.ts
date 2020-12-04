import "phaser";
import { Utility } from "../Consts/Utility";

export class ScoreManager
{
    private static instance: ScoreManager;
    public static get Instance()
    {
        if(!ScoreManager.instance)
            ScoreManager.instance = new ScoreManager();

        return ScoreManager.instance;
    }

    private scene: Phaser.Scene;
    private updatingScoreEvent: Phaser.Time.TimerEvent;
    private displayedScore: number;
    private score: number;
    private scoreText: Phaser.GameObjects.Text;
    private readonly prefix: string = "Score: ";
    private readonly same_color_score: number = 10;
    private readonly fallen_bubble_score: number = 20;

    private constructor(){ }

    public init(scene: Phaser.Scene, x: number, y: number): void
    {
        this.scene = scene;
        this.updatingScoreEvent = null;
        this.displayedScore = 0;
        this.score = 0;
        this.scoreText = scene.add.text(
            x,
            y,
            this.prefix + this.displayedScore.toString(),
            {
                font: Utility.getScaleByWidth(scene, 36).toString() + "px Arial",
                fill: "#FFFFFF",
                align: "center"
            }
        ).setOrigin(0.5);
    }

    public calculateScore(sameColorBubble: number, fallenBubble: number): void
    {
        let scoring = (sameColorBubble * this.same_color_score) + (fallenBubble * this.fallen_bubble_score);
        this.plusScore(scoring);
    }

    private plusScore(value: number): void
    {
        if(value > 0)
        {
            this.score += value;
            this.updateScoreText();
        }
    }

    private updateScoreText(): void
    {
        if(this.updatingScoreEvent != null)
            this.updatingScoreEvent.remove(false);

        this.updatingScoreEvent = this.scene.time.addEvent({
            "loop": true,
            "callback": () => {
                this.displayedScore += 10;
                if(this.displayedScore > this.score)
                    this.displayedScore = this.score;
                this.scoreText.setText(this.prefix + this.displayedScore.toString());

                if(this.displayedScore == this.score)
                {
                    this.updatingScoreEvent.remove(false);
                    this.updatingScoreEvent = null;
                }
            },
            "callbackScope": this
        });
    }
}