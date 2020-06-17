import {
    BOOT_2_SCENE_KEY,
    FIGHT_SCENE_KEY,
    LEVEL_JSON_PATH,
} from "../Globals";

export default class BootStep2 extends Phaser.Scene {
    constructor() {
        super({key: BOOT_2_SCENE_KEY});
    }

    /*---------------------------------------------------------------------------*/

    init(global_data) {
        this.GLOBAL = global_data;
    }

    /*---------------------------------------------------------------------------*/

    preload() {
        const {LEVEL_ID: level_id} = this.GLOBAL;

        //load the json referenced in the levels json_keys file
        Object.entries(this.cache.json.get('level_json_keys')).forEach(([key, path]) => {
            this.load.json(key, `${LEVEL_JSON_PATH}/${level_id}/${path}`);
        });
    }

    /*---------------------------------------------------------------------------*/

    create() {
        this.scene.start(FIGHT_SCENE_KEY, this.GLOBAL);
    }
}