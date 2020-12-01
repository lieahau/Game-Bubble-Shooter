import "phaser";
import { TextureKeys } from "../Consts/TextureKeys";
import { EventKeys } from "../Consts/EventKeys";
import { Bubble } from "../Objects/Bubble";

export class BubbleManager extends Phaser.GameObjects.Group
{
    constructor(scene: Phaser.Scene, config: Phaser.Types.GameObjects.Group.GroupConfig = {})
    {
        let defaults: Phaser.Types.GameObjects.Group.GroupConfig =
        {
			classType: Bubble,
			maxSize: -1
		};

		super(scene, Object.assign(defaults, config));
		scene.events.on(EventKeys.DESPAWNBUBBLE, this.despawn, this);
    }

    spawn(x = 0, y = 0): Bubble
	{
        let bubbleInPool: boolean = (this.countActive(false) > 0);

        let bubble: Bubble = this.get(x, y, TextureKeys.Bubble, 0);

        if(!bubble)
            return;

        if(bubbleInPool)
            bubble.enableBody(true, x, y, true, true);

		bubble.reset();
		return bubble;
	}

	despawn(bubble: Bubble): void
	{
		bubble.setPosition(0);
		bubble.refreshBody();
        this.killAndHide(bubble);
        bubble.removeInteractive();
		bubble.disableBody(true, true);
    }
    
    initializeWithSize(size: number): void
	{
		if(this.getLength() > 0 || size <= 0)
			return;

		this.createMultiple({
			classType: Bubble,
			key: TextureKeys.Bubble,
			quantity: size,
			visible: false,
			active: false
		})
	}
}
