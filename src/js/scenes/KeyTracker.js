import {
    KEY_TRACKER_KEY
} from "../globals";

export default class KeyTracker extends Phaser.Scene {
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

        const {UP, DOWN, LEFT, RIGHT, SLOW, FIRE, PAUSE} = this.GLOBAL.KEY_BINDINGS;

        //track player movement
        this.up = this.createPhaserKey(UP);
        this.down = this.createPhaserKey(DOWN);
        this.left = this.createPhaserKey(LEFT);
        this.right = this.createPhaserKey(RIGHT);
        //track player slowdown
        this.slow = this.createPhaserKey(SLOW);
        //track player fire
        this.firing = this.createPhaserKey(FIRE);

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

        //mark if game should be paused/unpaused on next scene update step
        this.updatePausePossibility('PAUSE', this.pause);
    }

    /*---------------------------------------------------------------------------*/

    setGlobalKey(key, phaser_key) {
        const keys = this.GLOBAL.KEYS;
        if (phaser_key.isDown) {
            keys[key] = true;
        } else if (phaser_key.isUp) {
            keys[key] = false;
        }
    }

    /*---------------------------------------------------------------------------*/

    updatePausePossibility(key, phaser_key) {
        const keys = this.GLOBAL.KEYS;

        //find out whether global key should be activated
        let activate = false;
        if (phaser_key.isDown) {
            if (!this.pause_pressed) {
                activate = true;
            }
            this.pause_pressed = true;
        } else if (phaser_key.isUp) {
            this.pause_pressed = false;
        }

        //set global key to new activation status
        keys[key] = activate;
    }
}