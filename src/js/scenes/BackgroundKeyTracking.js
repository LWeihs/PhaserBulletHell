import GLOBALS from "../Globals";
const {
    KEY_TRACKER_KEY
} = GLOBALS;

export default class BackgroundKeyTracking extends Phaser.Scene {
    constructor() {
        super({
            key: KEY_TRACKER_KEY,
        });
    }

    /*---------------------------------------------------------------------------*/

    init(global_data) {
        this.GLOBAL = global_data;
    }

    /*---------------------------------------------------------------------------*/

    create() {
        this.cursors = this.input.keyboard.createCursorKeys();

        //bind keys according to key binding specification
        const {UP, DOWN, LEFT, RIGHT, SLOW, FIRE, SPECIAL, PAUSE, ENTER} = this.GLOBAL.KEY_BINDINGS;

        //track player movement
        this.up = this._createPhaserKey(UP);
        this.down = this._createPhaserKey(DOWN);
        this.left = this._createPhaserKey(LEFT);
        this.right = this._createPhaserKey(RIGHT);
        //track player slowdown
        this.slow = this._createPhaserKey(SLOW);
        //track player fire
        this.firing = this._createPhaserKey(FIRE);
        //track player special
        this.special = this._createPhaserKey(SPECIAL);
        //track player accepting prompts etc
        this.enter = this._createPhaserKey(ENTER);

        //scene pausing
        this.pause = this._createPhaserKey(PAUSE);
        this.pause_pressed = false; //track continuous holding of pause key
    }

    /*---------------------------------------------------------------------------*/

    _createPhaserKey({type, key: key_bind}) {
        switch (type) {
            case 'cursor':
                return this._createPhaserCursorKey(key_bind);
            case 'keyboard':
                return this._createPhaserKeyboardKey(key_bind);
        }
    }

    /*---------------------------------------------------------------------------*/

    _createPhaserCursorKey(key_bind) {
        return this.cursors[key_bind];
    }

    /*---------------------------------------------------------------------------*/

    _createPhaserKeyboardKey(key_bind) {
        return this.input.keyboard.addKey(
            Phaser.Input.Keyboard.KeyCodes[key_bind]
        );
    }

    /*---------------------------------------------------------------------------*/

    update() {
        //update player movement
        this._setGlobalKey('UP', this.up);
        this._setGlobalKey('DOWN', this.down);
        this._setGlobalKey('LEFT', this.left);
        this._setGlobalKey('RIGHT', this.right);
        //update player slowdown
        this._setGlobalKey('SLOW', this.slow);
        //update player fire
        this._setGlobalKey('FIRE', this.firing);
        //mark that player wants to use his special action
        this._setGlobalKey('SPECIAL', this.special);
        //mark that player wants to proceed through given prompt
        this._setGlobalKey('ENTER', this.enter);

        //mark if game should be paused/unpaused on next scene update step
        this._updatePausePossibility('PAUSE', this.pause);
    }

    /*---------------------------------------------------------------------------*/

    _setGlobalKey(key, phaser_key) {
        const {pressed, active} = this._determineNextKeyState(key, phaser_key);
        this._setKeyTrackerNextKeyState(key, pressed, active);
    }

    /*---------------------------------------------------------------------------*/

    _updatePausePossibility(key, phaser_key) {
        const {pressed, active: key_active_possible} =
            this._determineNextKeyState(key, phaser_key);
        //pause key only counts as active on initial press
        let key_active = false;
        if (key_active_possible) {
            if (!this.pause_pressed) {
                key_active = true;
            }
            this.pause_pressed = true;
        } else {
            this.pause_pressed = false;
        }
        //set new state
        this._setKeyTrackerNextKeyState(key, pressed, key_active);
    }

    /*---------------------------------------------------------------------------*/

    _determineNextKeyState(key, phaser_key) {
        const pressed = phaser_key.isDown;

        //normally, pressed key is also seen as active
        const res = {
            pressed: pressed,
            active: pressed,
        };
        //blocked keys are not active keys
        const {blocked} = this.GLOBAL.KEY_TRACKER;
        if (blocked[key]) {
            res.active = false;
        }
        return res;
    }

    /*---------------------------------------------------------------------------*/

    _setKeyTrackerNextKeyState(key, pressed, active) {
        const key_tracker = this.GLOBAL.KEY_TRACKER;
        key_tracker.setKeyPressed(key, pressed);
        key_tracker.setKeyActivity(key, active);
    }
}