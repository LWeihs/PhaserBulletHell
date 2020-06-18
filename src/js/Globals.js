const GLOBALS = {
    /** SCENE KEYS **/
    BOOT_1_SCENE_KEY: 'boot1',
    BOOT_2_SCENE_KEY: 'boot2',
    FIGHT_SCENE_KEY: 'fight',
    PAUSE_SCENE_KEY: 'pause',
    KEY_TRACKER_KEY: 'key_tracker',

    /** KEY BINDINGS **/
    KEY_BINDINGS: {
        //player movement
        UP: {type: 'cursor', key: 'up'},
        DOWN: {type: 'cursor', key: 'down'},
        LEFT: {type: 'cursor', key: 'left'},
        RIGHT: {type: 'cursor', key: 'right'},
        //player actions
        SLOW: {type: 'cursor', key: 'shift'},
        FIRE: {type: 'keyboard', key: 'Y'},
        SPECIAL: {type: 'keyboard', key: 'X'},
        //general
        PAUSE: {type: 'keyboard', key: 'ESC'},
        ENTER: {type: 'keyboard', key: 'ENTER'},
    },

    /** BACKGROUNDS **/

    BACKGROUND_ALPHA: 0.5,

    /** PAUSE MENU **/

    PAUSE_INPUT_DEBOUNCE_INITIAL_MS: 500,
    PAUSE_INPUT_DEBOUNCE_QUICK_MS: 250,
    PAUSE_OVERLAY_ALPHA: 0.94,
    PAUSE_MENU_UPPER_LEFT: {
        x: 1 / 20,
        y: 6 / 10,
    },
    PAUSE_MENU_Y_OFFSET: 1 / 100,

    /** POSITIONING **/

    PLAYER_OFFSETS: {
        x: 1 / 2,
        y: 9 / 10,
    },
    BOSS_OFFSETS: {
        x: 1 / 2,
        y: 1 / 10,
    },
    BOSS_LIMITS: {
        x_min: 0,
        x_max: 1,
        y_min: 0,
        y_max: 0.42,
    },

    /** FOLDER STRUCTURE **/

    ASSET_PATH: 'assets',
    MENU_ASSETS_FOLDER: 'menu',
    PLAYER_JSON_PATH: 'player',
    LEVEL_JSON_PATH: 'levels',

    /** PLAYER INFORMATION (SAME BETWEEN ALL PLAYERS) **/

    INVIS_FRAMES_AFTER_HIT: 60,
    ENERGY_PASSIVE_ACCUMULATION: 2,
    ENERGY_ACCUMULATION_INTERVAL: 100, //ms

    /** PLAYER SPECIALS **/

    PLAYER_BLINK_DISTANCE: 300,

    /** GAME STATE INFORMATION **/

    PLAYER_MAX_LIVES: 99,

    /** UI **/
    ENERGY_METER: {
        MIDPOINT_OFFSETS: {
            x: 1 / 2,
            y: 29 / 30,
        },
        WIDTH: 400,
        HEIGHT: 20,
        BG_COLOR: 0xffcccc,
        FILL_COLOR: 0x29a329,
        BORDER_WIDTH: 4,
    },

    BOSS_HEALTHBAR: {
        MIDPOINT_OFFSETS: {
            x: 1 / 2,
            y: 1 / 30,
        },
        WIDTH: 1000,
        HEIGHT: 40,
        BG_COLOR: 0xffcccc,
        FILL_COLOR: 0xcc0000,
        BORDER_WIDTH: 4,
    }
};

export default GLOBALS;
