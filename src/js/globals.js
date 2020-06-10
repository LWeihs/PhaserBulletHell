/** SCENE KEYS **/

const BOOT_1_SCENE_KEY = 'boot1';
const BOOT_2_SCENE_KEY = 'boot2';
const FIGHT_SCENE_KEY = 'fight';
const PAUSE_SCENE_KEY = 'pause';
const KEY_TRACKER_KEY = 'key_tracker';

/** KEY BINDINGS **/

const KEY_BINDINGS = {
    //player movement
    UP: {type: 'cursor', key: 'up'},
    DOWN: {type: 'cursor', key: 'down'},
    LEFT: {type: 'cursor', key: 'left'},
    RIGHT: {type: 'cursor', key: 'right'},
    SLOW: {type: 'cursor', key: 'shift'},
    FIRE: {type: 'keyboard', key: 'Y'},
    //general
    PAUSE: {type: 'keyboard', key: 'ESC'},
    ENTER: {type: 'keyboard', key: 'ENTER'},
};

/** BACKGROUNDS **/

const BACKGROUND_ALPHA = 0.5;
const DEFAULT_SCROLL_SPEED = 2;

/** PAUSE MENU **/

const PAUSE_INPUT_DEBOUNCE_INITIAL_MS = 500;
const PAUSE_INPUT_DEBOUNCE_QUICK_MS = 250;
const PAUSE_OVERLAY_ALPHA = 0.94;

/** POSITIONING **/

const PLAYER_OFFSETS = {
    x: 1/2,
    y: 9/10,
};
const BOSS_OFFSETS = {
    x: 1/2,
    y: 1/10,
};
const BOSS_LIMITS = {
    x_min: 0,
    x_max: 1,
    y_min: 0,
    y_max: 0.42,
};

/** FOLDER STRUCTURE **/

const ASSET_PATH = 'assets';
const MENU_ASSETS_FOLDER = 'menu';
const PLAYER_JSON_PATH = 'player';
const LEVEL_JSON_PATH = 'levels';

/** PLAYER INFORMATION (SAME BETWEEN ALL PLAYERS) **/

const INVIS_FRAMES_AFTER_HIT = 60;

export {
    BOOT_1_SCENE_KEY,
    BOOT_2_SCENE_KEY,
    FIGHT_SCENE_KEY,
    PAUSE_SCENE_KEY,
    KEY_TRACKER_KEY,
    KEY_BINDINGS,
    PLAYER_OFFSETS,
    BOSS_OFFSETS,
    BOSS_LIMITS,
    ASSET_PATH,
    MENU_ASSETS_FOLDER,
    BACKGROUND_ALPHA,
    DEFAULT_SCROLL_SPEED,
    PAUSE_INPUT_DEBOUNCE_INITIAL_MS,
    PAUSE_INPUT_DEBOUNCE_QUICK_MS,
    PAUSE_OVERLAY_ALPHA,
    PLAYER_JSON_PATH,
    LEVEL_JSON_PATH,
    INVIS_FRAMES_AFTER_HIT,
}