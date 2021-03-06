import "phaser";

import { SceneKeys } from "../Consts/SceneKeys";
import { EventKeys } from "../Consts/EventKeys";

import { ScoreManager } from "../Managers/ScoreManager";
import { BubbleManager } from "../Managers/BubbleManager";

import { Background } from "../Objects/Background";
import { Boundary } from "../Objects/Boundary";
import { FPSText } from "../Objects/FPSText";

import { Board } from "../Objects/Board";
import { Tile } from "../Objects/Tile"
import { Player } from "../Objects/Player";

import { PanelEndGame } from "../Objects/PanelEndGame";

export class GameScene extends Phaser.Scene
{
    private background: Background;

    private boundary: Boundary;

    private board: Board;
    private fpsText: FPSText;

    private bubbleManager: BubbleManager;

    private player: Player;

    private endGameScreen: PanelEndGame; 

    constructor()
    {
        super({ key: SceneKeys.Game });
    }

    init(): void
    {
        // calculate tile size
        Tile.calculateTileSize(this);
    }
    
    create(): void
    {
        // setup board, bubble pool
        this.board = new Board(this);
        this.bubbleManager = new BubbleManager(this);
        this.bubbleManager.initializeWithSize(40);

        // setup background, fps text, and score
        this.background = new Background(this, this.board.rowheight);
        this.fpsText = new FPSText(this);
        ScoreManager.Instance.init(this, this.background.header.width/2, this.background.header.height/2);

        // setup boundary
        let leftX = -Tile.WIDTH, leftY = this.background.header.height, leftW = Tile.WIDTH, leftH = this.background.playArea.height;
        let topX = leftX, topY = 0, topW = this.background.header.width + (Tile.WIDTH * 2), topH = this.background.header.height;
        let rightX = this.cameras.main.width, rightY = leftY, rightW = leftW, rightH = leftH;
        this.boundary = new Boundary(this, leftX, leftY, leftW, leftH, topX, topY, topW, topH, rightX, rightY, rightW, rightH);
        
        // setup player
        this.player = new Player(
            this,
            this.cameras.main.width/2,
            this.background.header.height + this.background.playArea.height,
            this.bubbleManager,
            this.boundary,
            this.background.footer.getBounds()
        );

        // setup end game screen
        this.endGameScreen = new PanelEndGame(
            this,
            this.cameras.main.width/2,
            this.cameras.main.height/2,
        );

        // setup new level
        this.board.setY(this.background.header.height + Tile.HEIGHT/2);
        this.board.createLevel(this.bubbleManager);

        // start play
        this.events.emit(EventKeys.NEXTBUBBLE, {colorsCount: this.board.colorsCount});
    }
};