import {
    KEY_TRACKER_KEY
} from "../globals";

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
        const {UP, DOWN, LEFT, RIGHT, SLOW, FIRE, PAUSE, ENTER} = this.GLOBAL.KEY_BINDINGS;

        //track player movement
        this.up = this.createPhaserKey(UP);
        this.down = this.createPhaserKey(DOWN);
        this.left = this.createPhaserKey(LEFT);
        this.right = this.createPhaserKey(RIGHT);
        //track player slowdown
        this.slow = this.createPhaserKey(SLOW);
        //track player fire
        this.firing = this.createPhaserKey(FIRE);
        //track player accepting prompts etc
        this.enter = this.createPhaserKey(ENTER);

        //scene pausing
        this.pause = this.createPhaserKey(PAUSE);
        this.pause_pressed = false; //track continuous holding of pause key
    }

    /*---------------------------------------------------------------------------*/

    createPhaserKey({type, key: key_bind}) {
        switch (type) {
            case 'cursor':
                return this.createPhaserCursorKey(key_bind);
            case 'keyboard':
                return this.createPhaserKeyboardKey(key_bind);
        }
    }

    /*---------------------------------------------------------------------------*/

    createPhaserCursorKey(key_bind) {
        return this.cursors[key_bind];
    }

    /*---------------------------------------------------------------------------*/

    createPhaserKeyboardKey(key_bind) {
        return this.input.keyboard.addKey(
            Phaser.Input.Keyboard.KeyCodes[key_bind]
        );
    }

    /*---------------------------------------------------------------------------*/

    update() {
        //update player movement
        this.setGlobalKey('UP', this.up);
        this.setGlobalKey('DOWN', this.down);
        this.setGlobalKey('LEFT', this.left);
        this.setGlobalKey('RIGHT', this.right);
        //update player slowdown
        this.setGlobalKey('SLOW', this.slow);
        //update player fire
        this.setGlobalKey('FIRE', this.firing);
        //mark that player wants to proceed through given prompt
        this.setGlobalKey('ENTER', this.enter);

        //mark if game should be paused/unpaused on next scene update step
        this.updatePausePossibility('PAUSE', this.pause);
    }

    /*---------------------------------------------------------------------------*/

    setGlobalKey(key, phaser_key) {
        const {pressed, active} = this.determineNextKeyState(key, phaser_key);
        this.setKeyTrackerNextKeyState(key, pressed, active);
    }

    /*---------------------------------------------------------------------------*/

    updatePausePossibility(key, phaser_key) {
        const {pressed, active: key_active_possible} =
            this.determineNextKeyState(key, phaser_key);
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
        this.setKeyTrackerNextKeyState(key, pressed, key_active);
    }

    /*---------------------------------------------------------------------------*/

    determineNextKeyState(key, phaser_key) {
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

    setKeyTrackerNextKeyState(key, pressed, active) {
        const key_tracker = this.GLOBAL.KEY_TRACKER;
        key_tracker.setKeyPressed(key, pressed);
        key_tracker.setKeyActivity(key, active);
    }
}