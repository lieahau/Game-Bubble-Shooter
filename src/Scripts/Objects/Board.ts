import "phaser";
import { AudioKeys } from "../Consts/AudioKeys";

import { BubbleColors } from "../Consts/Colors";
import { EventKeys } from "../Consts/EventKeys";
import { Utility } from "../Consts/Utility";

import { BubbleManager } from "../Managers/BubbleManager";
import { ScoreManager } from "../Managers/ScoreManager";

import { Bubble } from "./Bubble";
import { Tile } from "./Tile";

export class Board extends Phaser.GameObjects.Container
{
    public static readonly ROWS: number = 11;
    public static readonly COLUMNS: number = 8;
    public static readonly INITIALROWS: number = 5;
    public tiles: Tile[][];
    public colorsCount: Partial<Record<BubbleColors, number>>;
    public rowheight: number;
    public sfx: Phaser.Sound.BaseSound;
    private static readonly EVEN_NEIGHBORS: { [index: string]: any } = {
        TOPLEFT: { row: -1, col: -1 },
        TOPRIGHT: { row: -1, col: 0 },
        RIGHT: { row: 0, col: 1 },
        BOTTOMRIGHT: { row: 1, col: 0 },
        BOTTOMLEFT: { row: 1, col: -1 },
        LEFT: { row: 0, col: -1 },
    }

    private static readonly ODD_NEIGHBORS: { [index: string]: any } = {
        TOPLEFT: { row: -1, col: 0 },
        TOPRIGHT: { row: -1, col: 1 },
        RIGHT: { row: 0, col: 1 },
        BOTTOMRIGHT: { row: 1, col: 1 },
        BOTTOMLEFT: { row: 1, col: 0 },
        LEFT: { row: 0, col: -1 },
    }

    constructor(scene: Phaser.Scene)
    {
        super(scene);
        scene.add.existing(this);
        this.rowheight = Tile.HEIGHT - Utility.getScaleByWidth(scene, 10);

        this.tiles = [];
        for(let i = 0; i < Board.ROWS; i++)
        {
            this.tiles[i] = [];
            for(let j = 0; j < Board.COLUMNS; j++)
            {
                if(i % 2 == 1 && j == Board.COLUMNS -1) // odd row only have (columns - 1) bubble
                    break;
                this.tiles[i][j] = new Tile(scene, i, j, this.rowheight);
            }
        }

        let w = Board.COLUMNS * Tile.WIDTH;
        let h = Board.ROWS * this.rowheight;

        this.setSize(w, h);
        this.initColorsCount();

        this.sfx = scene.sound.add(AudioKeys.Shoot);
        this.scene.events.on(EventKeys.BUBBLECOLLIDE, this.onBubbleCollision, this);
    }

    private resetVisitedTiles(): void
    {
        for(let i = 0; i < this.tiles.length; i++)
            for(let j = 0; j < this.tiles[i].length; j++)
                this.tiles[i][j].resetVisited();
    }

    private onBubbleCollision(args?: any): void
    {
        let shootedBubble: Bubble = args.shootedBubble;

        this.colorsCount[shootedBubble.color]++;
        let targetTile: Tile = this.setBubblePosition(shootedBubble);
        
        let cluster: Tile[] = [];
        this.resetVisitedTiles();
        this.findCluster(targetTile, cluster, targetTile.bubble.color);
        if(cluster.length >= 3)
        {
            // play bubble animation and remove from tile.
            cluster.forEach(function(tile)
            {
                this.colorsCount[tile.bubble.color]--;
                tile.bubble.playAnimDestroy();
                tile.setBubble(null);
            }, this);

            // find floating cluster and remove it from tile
            let floatingCluster: Tile[] = this.findFloatingCluster();
            floatingCluster.forEach(function(tile)
            {
                this.colorsCount[tile.bubble.color]--;
                tile.bubble.playAnimFallen();
                tile.setBubble(null);
            }, this);

            // update score
            ScoreManager.Instance.calculateScore(cluster.length, floatingCluster.length);

            // play sfx
            this.sfx.play();

            let isWin: boolean = true;
            for(let i = 0; i < this.tiles[0].length; i++)
            {
                if(this.tiles[0][i].bubble != null)
                {
                    isWin = false;
                    break;
                }
            }

            if(isWin)
            {
                // win
                this.scene.events.emit(EventKeys.ENDGAME, {"isWin": true});
            }
            else
            {
                this.scene.time.addEvent({
                    delay: 750,
                    callback: () =>
                    {
                        this.scene.events.emit(EventKeys.NEXTBUBBLE, {colorsCount: this.colorsCount});
                    }
                });
            }

            return;
        }

        if(targetTile.row < Board.ROWS - 1)
            this.scene.events.emit(EventKeys.NEXTBUBBLE, {colorsCount: this.colorsCount});
        else
        {
            // lose
            this.scene.events.emit(EventKeys.ENDGAME, {"isWin": false});
        }
    }

    private findCluster(currentTile: Tile, cluster: Tile[], targetColor: BubbleColors = null): void
    {
        if(currentTile.visited)
            return;
        currentTile.visited = true;
        
        if(currentTile.isEmpty() || (targetColor != null && currentTile.bubble.color != targetColor))
            return;
        
        cluster.push(currentTile);

        let neighbors = (currentTile.row % 2) ? Board.ODD_NEIGHBORS : Board.EVEN_NEIGHBORS;
        Object.keys(neighbors).forEach(key => {
            let row = currentTile.row + neighbors[key].row;
            let col = currentTile.column + neighbors[key].col;
            if(row >= 0 && col >= 0 && row < this.tiles.length && col < this.tiles[row].length)
            {
                let nextTile: Tile = this.tiles[row][col];
                this.findCluster(nextTile, cluster, targetColor);
            }
        });
        // for(let i = 0; i < neighbors.length; i++)
        // {
        //     let row = currentTile.row + neighbors[i].row;
        //     let col = currentTile.column + neighbors[i].col;
        //     if(row >= 0 && col >= 0 && row < this.tiles.length && col < this.tiles[row].length)
        //     {
        //         let nextTile: Tile = this.tiles[row][col];
        //         this.findCluster(nextTile, cluster, targetColor);
        //     }
        // }
    }

    private findFloatingCluster(): Tile[]
    {
        let floatingCluster: Tile[] = [];
        this.resetVisitedTiles();

        for(let i = 0; i < this.tiles.length; i++)
        {
            for(let j = 0; j < this.tiles[i].length; j++)
            {
                let tile: Tile = this.tiles[i][j];
                if(tile.visited || tile.isEmpty())
                    continue;
                
                // find cluster
                let cluster: Tile[] = [];
                this.findCluster(tile, cluster);

                // no cluster for this tile
                if(cluster.length == 0)
                    continue;
                
                // check if cluster is floating
                let floating = true;
                for(let k = 0; k < cluster.length; k++)
                {
                    if(cluster[k].row == 0)
                    {
                        // There's a tile in this cluster that attached to the roof
                        floating = false;
                        break;
                    }
                }

                if(floating)
                    floatingCluster.push(...cluster);
            }
        }

        return floatingCluster;
    }

    private setBubblePosition(shootedBubble: Bubble): Tile
    {
        let found: boolean = false;
        let resultTile: Tile = this.tiles[0][0];

        let nearestDistance: number = Phaser.Math.Distance.BetweenPoints(resultTile, shootedBubble);
        for(let i = 0; i < this.tiles.length; i++)
        {
            for(let j = 0; j < this.tiles[i].length; j++)
            {
                let currentTile: Tile = this.tiles[i][j];
                // the tile y position is still far away from bubble, continue loop to the next row
                if(currentTile.y < shootedBubble.y - Tile.HEIGHT)
                    break;
                
                // has been looping away from the bubble, consider the result tile is found alraedy.
                if(currentTile.y > shootedBubble.y + Tile.HEIGHT)
                {
                    found = true;
                    break;
                }
                
                // got the row for bubble, now find the nearest empty column
                if(currentTile.isEmpty())
                {
                    let currentDistance = Phaser.Math.Distance.BetweenPoints(currentTile, shootedBubble);
                    if(currentDistance < nearestDistance)
                    {
                        nearestDistance = currentDistance;
                        resultTile = currentTile;
                    }
                }
            }

            if(found)
                break;
        }

        resultTile.setBubble(shootedBubble);
        return resultTile;
    }

    private getTile(bubble: Bubble): Tile
    {
        let tile: Tile = null;

        for(let i = 0; i < this.tiles.length; i++)
        {
            let res = this.tiles[i].find(e => e.bubble == bubble);
            if(res)
            {
                tile = res;
                break;
            }
        }

        return tile;
    }

    public initColorsCount(): void
    {
        this.colorsCount = { };

        Object.values(BubbleColors).filter(x => typeof x === "number").forEach(key => {
            this.colorsCount[key] = 0;
        });
    }

    public createLevel(manager: BubbleManager): void
    {
        for(let i = 0; i < Board.INITIALROWS; i++)
        {
            for(let j = 0; j < this.tiles[i].length; j++)
            {
                let tile: Tile = this.tiles[i][j];
                let bubble: Bubble = manager.spawn(tile.x, tile.y);
                bubble.setRandomColor();
                tile.setBubble(bubble);
                this.colorsCount[bubble.color]++;
            }
        }
    }

    setX(value: number): this
    {
        let diff = value - this.x;
        super.setX(value);

        for(let i = 0; i < this.tiles.length; i++)
            for(let j = 0; j < this.tiles[i].length; j++)
                this.tiles[i][j].x += diff;

        return this;
    }

    setY(value: number): this
    {
        let diff = value - this.y;
        super.setY(value);

        for(let i = 0; i < this.tiles.length; i++)
            for(let j = 0; j < this.tiles[i].length; j++)
                this.tiles[i][j].y += diff;

        return this;
    }
}