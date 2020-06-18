const key_base = {
    //player movement
    UP: false,
    DOWN: false,
    LEFT: false,
    RIGHT: false,
    //player slow down
    SLOW: false,
    //player fire bullets/accept prompts
    FIRE: false,
    //player special action
    SPECIAL: false,
    //player input to pause/unpause game
    PAUSE: false,
    //enter key to accept prompts
    ENTER: false,
};

export default class KeyTracker {
    constructor() {
        //track which keys are currently active, i.e., should be reacted to
        this.active_keys = Object.assign({}, key_base);
        //track which keys are currently pressed (may be blocked, however!)
        this.pressed_keys = Object.assign({}, key_base);
        //track the first event when button pressed
        this.first_pressed = Object.assign({}, key_base);
        //track for which keys hits should not lead to activity
        this.blocked = Object.assign({}, key_base);
    }

    /*---------------------------------------------------------------------------*/

    setKeyActivity(key, is_active) {
        if (is_active) {
            this.setKeyActive(key);
        } else {
            this.setKeyInactive(key);
        }
    }

    /*---------------------------------------------------------------------------*/

    setKeyActive(key) {
        this.active_keys[key] = true;
    }

    /*---------------------------------------------------------------------------*/

    setKeyInactive(key) {
        this.active_keys[key] = false;
    }

    /*---------------------------------------------------------------------------*/

    setKeyPressed(key, is_pressed) {
        if (is_pressed) {
            this.markKeyDown(key);
        } else {
            this.markKeyUp(key);
        }
    }

    /*---------------------------------------------------------------------------*/

    markKeyDown(key) {
        if (this.pressed_keys[key]) {
            this.first_pressed[key] = false;
        } else {
            this.pressed_keys[key] = true;
            this.first_pressed[key] = true;
        }
    }

    /*---------------------------------------------------------------------------*/

    markKeyUp(key) {
        this.pressed_keys[key] = false;
        this.first_pressed[key] = false;
    }

    /*---------------------------------------------------------------------------*/

    removeAllBlocks() {
        this.blocked = Object.assign({}, key_base);
    }

    /*---------------------------------------------------------------------------*/

    setKeyBlocked(key) {
        this.blocked[key] = true;
    }

    /*---------------------------------------------------------------------------*/

    setKeyUnblocked(key) {
        this.blocked[key] = false;
    }

    /*---------------------------------------------------------------------------*/

    /**
     * @returns {Phaser.Timer} - the timer that was started within the debounce
     */
    debounceKey(key, delay, game) {
        this.setKeyBlocked(key);
        return game.time.addEvent({
            delay: delay,
            callback: () => {
                this.setKeyUnblocked(key);
            },
        });
    }
}