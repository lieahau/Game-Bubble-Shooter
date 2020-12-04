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
        let targetTile: Tile = null;
        
        if(args.collideWithGroup)
        {
            let collidedBubble: Bubble = args.collidedBubble;
            targetTile = this.setBubblePosition(shootedBubble, collidedBubble);
        }
        else
        {
            targetTile = this.setBubblePosition(shootedBubble);
        }

        this.colorsCount[shootedBubble.color]++;        
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
        
        // bubble in this tile has same color as the targeted color
        cluster.push(currentTile);

        // iterate its neighbors and do dfs
        let neighbors = (currentTile.row % 2) ? Board.ODD_NEIGHBORS : Board.EVEN_NEIGHBORS;
        Object.keys(neighbors).forEach(key =>
        {
            let row = currentTile.row + neighbors[key].row;
            let col = currentTile.column + neighbors[key].col;
            if(row >= 0 && col >= 0 && row < this.tiles.length && col < this.tiles[row].length)
            {
                let nextTile: Tile = this.tiles[row][col];
                this.findCluster(nextTile, cluster, targetColor);
            }
        });
    }

    private findFloatingCluster(): Tile[]
    {
        let floatingCluster: Tile[] = [];

        // reset visited tiles
        this.resetVisitedTiles();

        // iterate all tiles on the board
        for(let i = 0; i < this.tiles.length; i++)
        {
            for(let j = 0; j < this.tiles[i].length; j++)
            {
                let tile: Tile = this.tiles[i][j];

                // continue to the next loop if tile is empty or already visited
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

                // this cluster is floating, push it to floatingCluster array
                if(floating)
                    floatingCluster.push(...cluster);
            }
        }

        return floatingCluster;
    }

    private setBubblePosition(shootedBubble: Bubble, collidedBubble: Bubble = null): Tile
    {
        let resultTile: Tile = this.tiles[0][0];
        let nearestDistance: number = Phaser.Math.Distance.BetweenPoints(resultTile, shootedBubble);

        if(collidedBubble == null)
        {
            // bubble collide with top boundary, find the nearest tile based on first row.
            for(let i = 0; i < this.tiles[0].length; i++)
            {
                let output = { "resultTile": resultTile }
                nearestDistance = this.setNearestTile(this.tiles[0][i], shootedBubble, output, nearestDistance);
                resultTile = output.resultTile;
            }
        }
        else
        {
            // bubble collide with another bubble
            let collidedTile: Tile = this.getTile(collidedBubble);

            // iterate the collided bubble neighbors to find the nearest tile
            let neighbors = (collidedTile.row % 2) ? Board.ODD_NEIGHBORS : Board.EVEN_NEIGHBORS;
            Object.keys(neighbors).forEach(key =>
            {
                let row = collidedTile.row + neighbors[key].row;
                let col = collidedTile.column + neighbors[key].col;
                if(row >= 0 && col >= 0 && row < this.tiles.length && col < this.tiles[row].length)
                {
                    let output = { "resultTile": resultTile }
                    nearestDistance = this.setNearestTile(this.tiles[row][col], shootedBubble, output, nearestDistance);
                    resultTile = output.resultTile;
                }
            });
        }

        // set the bubble to the tile
        resultTile.setBubble(shootedBubble);
        return resultTile;
    }

    private setNearestTile(checkTile: Tile, bubble: Bubble, output, currentNearestDistance: number): number
    {
        if(!checkTile.isEmpty())
            return currentNearestDistance;
        
        let distance = Phaser.Math.Distance.BetweenPoints(checkTile, bubble);
        if(distance < currentNearestDistance)
        {
            output.resultTile = checkTile;
            return distance;
        }
        return currentNearestDistance;
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