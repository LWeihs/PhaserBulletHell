import {
    BOOT_1_SCENE_KEY,
    BOOT_2_SCENE_KEY,
    KEY_TRACKER_KEY,
    PLAYER_JSON_PATH,
    KEY_BINDINGS,
    LEVEL_JSON_PATH,
} from "../Globals";
import KeyTracker from "../KeyTracker";

export default class BootStep1 extends Phaser.Scene
{
    constructor() {
        super({ key: BOOT_1_SCENE_KEY });
    }

    /*---------------------------------------------------------------------------*/

    init(global_data) {
        //initialize (changing!) globals to be shared between scenes
        if (Object.keys(global_data).length) {
            this.GLOBAL = global_data;
        } else {
            this.GLOBAL = {
                //current level
                LEVEL_ID: "level_1",
                //currently set key bindings
                KEY_BINDINGS: KEY_BINDINGS,
                //tracking of keyboard interactions
                KEY_TRACKER: new KeyTracker(),
                //was game paused before
                PAUSE_SCENE_LAUNCHED: false,
            };
        }
    }

    /*---------------------------------------------------------------------------*/

    preload() {
        const {LEVEL_ID: level_id} = this.GLOBAL;

        //load player information
        this.load.json('player_info', `${PLAYER_JSON_PATH}/kuglis.json`);

        //load level base information (backgrounds)
        this.load.json('level_base_info', `${LEVEL_JSON_PATH}/${level_id}/level_info.json`);
        //load level event timeline
        this.load.json('level_event_info', `${LEVEL_JSON_PATH}/${level_id}/events.json`);
        //load level scripting information
        this.load.json('level_json_keys', `${LEVEL_JSON_PATH}/${level_id}/json_keys.json`);
        //load level asset information (is map)
        this.load.json('level_asset_info', `${LEVEL_JSON_PATH}/${level_id}/asset_map.json`);
    }

    /*---------------------------------------------------------------------------*/

    create() {
        this.scene.launch(KEY_TRACKER_KEY, this.GLOBAL);
        this.scene.start(BOOT_2_SCENE_KEY, this.GLOBAL);
    }
}