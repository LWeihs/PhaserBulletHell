import {
    FIGHT_SCENE_KEY,
    PAUSE_SCENE_KEY,
} from "../globals";

export default class PauseScene extends Phaser.Scene {
    constructor() {
        super({
            key: PAUSE_SCENE_KEY,
        });
    }

    /*---------------------------------------------------------------------------*/

    init(global_data) {
        this.GLOBAL = global_data;
    }

    /*---------------------------------------------------------------------------*/

    update() {
        const {PAUSE: pause_key_down} = this.GLOBAL.KEYS;

        if (pause_key_down) {
            this.scene.stop;
            this.scene.resume(FIGHT_SCENE_KEY);
        }
    }
}