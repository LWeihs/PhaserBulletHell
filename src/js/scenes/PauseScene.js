import {
    FIGHT_SCENE_KEY,
    PAUSE_SCENE_KEY,
    ASSET_PATH,
    MENU_ASSETS_FOLDER,
    PAUSE_INPUT_DEBOUNCE_INITIAL_MS,
    PAUSE_INPUT_DEBOUNCE_QUICK_MS,
    PAUSE_OVERLAY_ALPHA,
    PAUSE_MENU_UPPER_LEFT,
    PAUSE_MENU_Y_OFFSET,
} from "../Globals";
import {getPositionFromPercentages} from "../SpriteHelpers";

const image_names = {
    continue: {
        selected: 'continue_selected',
        unselected: 'continue_unselected',
    },
    restart: {
        selected: 'restart_selected',
        unselected: 'restart_unselected',
    },
    exit: {
        selected: 'exit_selected',
        unselected: 'exit_unselected',
    },
};


export default class PauseScene extends Phaser.Scene {
    constructor() {
        super({
            key: PAUSE_SCENE_KEY,
        });
    }

    /*---------------------------------------------------------------------------*/

    init(global_data) {
        this.GLOBAL = global_data;
        //tracking of interactive items and interaction state
        this.menu_items = [
            'continue',
            'restart',
            'exit',
        ];
        this.menu_images = {};
        this.current_idx = 0;

        //events to execute on timer, by key that initiated them
        this.time_events = {};

        //control over placement of menu items
        this.next_item_position =
            getPositionFromPercentages(PAUSE_MENU_UPPER_LEFT, this.scale);
        this.item_y_offset = PAUSE_MENU_Y_OFFSET * this.scale.height;

        //initial blocks for specific keys
        this.can_accept_fire_key = false;
        this.can_accept_enter_key = false;
    }

    /*---------------------------------------------------------------------------*/

    incrementMenuIndex() {
        this.current_idx++;
        if (this.current_idx === this.menu_items.length) {
            this.current_idx = 0;
        }
    }

    /*---------------------------------------------------------------------------*/

    decrementMenuIndex() {
        this.current_idx--;
        if (this.current_idx < 0) {
            this.current_idx = this.menu_items.length-1;
        }
    }

    /*---------------------------------------------------------------------------*/

    preload() {
        //overlay
        this.load.image('overlay', this.makeAssetPath('overlay.png'));
        //images for menu elements
        Object.values(image_names).forEach(({selected, unselected}) => {
            [selected, unselected].forEach(id => {
                this.load.image(id, this.makeAssetPath(`${id}.png`));
            });
        });

    }

    /*---------------------------------------------------------------------------*/

    makeAssetPath(suffix) {
        return `${ASSET_PATH}/${MENU_ASSETS_FOLDER}/${suffix}`;
    }

    /*---------------------------------------------------------------------------*/

    create() {
        //add overlay on top of the current game screen
        this.createOverlay();

        //create items user can choose from to proceed
        for (const item_name in image_names) {
            //create next item using logged this.next_item_position
            const item = this.createMenuItem(item_name);
            //update placement for item after just added item
            this.moveNextItemPosition(item);
        }

        //set state of scene to its default state
        this.setSceneToFreshState();

        //behavior when the scene exits sleep mode
        this.events.on('wake', () => {
            this.setSceneToFreshState();
        })
    }

    /*---------------------------------------------------------------------------*/

    setSceneToFreshState() {
        //reset menu index
        this.current_idx = 0;
        //show correct menu item as highlighted after menu creation
        this.showCorrectSelection();
        //block menu interaction to avoid immediate exit
        this.can_accept_fire_key = false;
        this.can_accept_enter_key = false;
    }

    /*---------------------------------------------------------------------------*/

    createOverlay() {
        const {width: scene_width, height: scene_height} = this.scale;
        const overlay = this.add.tileSprite(scene_width/2, scene_height/2, scene_width,
            scene_height, 'overlay');
        overlay.setAlpha(PAUSE_OVERLAY_ALPHA);
        this.overlay = overlay;
    }

    /*---------------------------------------------------------------------------*/

    createMenuItem(item_name) {
        const {selected: sel_image_name, unselected: unsel_image_name} =
            image_names[item_name];
        //get next position for images
        const {x: item_x, y: item_y} = this.next_item_position;
        //create the images
        const sel_image = this.add.image(item_x, item_y, sel_image_name).setOrigin(0);
        const unsel_image = this.add.image(item_x, item_y, unsel_image_name).setOrigin(0);
        //log the images by item name
        this.menu_images[item_name] = {
            selected: sel_image,
            unselected: unsel_image,
        };
        //drawn images are same size, so return any
        return sel_image;
    }

    /*---------------------------------------------------------------------------*/

    moveNextItemPosition(last_added_item) {
        this.next_item_position.y += this.item_y_offset + last_added_item.height;
    }

    /*---------------------------------------------------------------------------*/

    update() {
        const key_tracker = this.GLOBAL.KEY_TRACKER;

        //check if user wants to resume game
        const {
            PAUSE: pause_key_active,
        } = key_tracker.active_keys;
        if (pause_key_active) {
            this.endPause();
            return;
        }

        //initially, proceed keys are not accepted - check if this should change
        this.changeProceedKeysAcceptance();
        //determine how scene should proceed when menu items get selected
        if (this.handleMenuItemSelection()) {
            return;
        }

        //update menu selection data structure on up and down keys
        this.updateMenuInformation();
        //update shown selection after update of data structure
        this.showCorrectSelection();
    }

    /*---------------------------------------------------------------------------*/

    changeProceedKeysAcceptance() {
        const key_tracker = this.GLOBAL.KEY_TRACKER;
        const {
            FIRE: fire_key_pressed,
            ENTER: enter_key_pressed,
        } = key_tracker.pressed_keys;
        if (!fire_key_pressed) {
            this.can_accept_fire_key = true;
        }
        if (!enter_key_pressed) {
            this.can_accept_enter_key = true;
        }
    }

    /*---------------------------------------------------------------------------*/

    handleMenuItemSelection() {
        const {
            FIRE: fire_key_active,
            ENTER: enter_key_active,
        } = this.GLOBAL.KEY_TRACKER.active_keys;

        //infer acceptance criteria
        const fire_key_accepted = fire_key_active && this.can_accept_fire_key;
        const enter_key_accepted = enter_key_active && this.can_accept_enter_key;

        //proceed if any acceptance criterion is satisfied
        if (fire_key_accepted || enter_key_accepted) {
            this.handleCurrentMenuItem();
            return true;
        }
        return false;
    }

    /*---------------------------------------------------------------------------*/

    handleCurrentMenuItem() {
        const cur_item = this.menu_items[this.current_idx];
        switch (cur_item) {
            case "continue":
                this.endPause();
                break;
            case "restart":
                break;
        }
    }

    /*---------------------------------------------------------------------------*/

    updateMenuInformation() {
        this.checkDirectionForMenuUpdate('UP');
        this.checkDirectionForMenuUpdate('DOWN');
    }

    /*---------------------------------------------------------------------------*/

    checkDirectionForMenuUpdate(key) {
        //get function to alter menu information by
        let index_update_fn;
        switch (key) {
            case 'UP':
                index_update_fn = this.decrementMenuIndex.bind(this);
                break;
            case 'DOWN':
                index_update_fn = this.incrementMenuIndex.bind(this);
                break;
        }
        //get necessary key information
        const key_tracker = this.GLOBAL.KEY_TRACKER;
        const key_pressed = key_tracker.pressed_keys[key];
        const key_first_pressed = key_tracker.first_pressed[key];
        const key_active = key_tracker.active_keys[key];

        //if key is up, free up menu interaction
        if (!key_pressed) {
            key_tracker.setKeyUnblocked(key);
            this.clearTimeEventsOfKey(key);
            return;
        }
        //if key active: move through menu states, debounce further movement
        if (key_active) {
            const delay = key_first_pressed
                ? PAUSE_INPUT_DEBOUNCE_INITIAL_MS
                : PAUSE_INPUT_DEBOUNCE_QUICK_MS;
            //state update
            index_update_fn();
            //debounce
            this.addDebounceEvent(key_tracker, key, delay);
        }
    }

    /*---------------------------------------------------------------------------*/

    addDebounceEvent(key_tracker, key, delay) {
        const event = key_tracker.debounceKey(key, delay, this);

        if (!this.time_events[key]) {
            this.time_events[key] = [];
        }
        this.time_events[key].push(event);
    }

    /*---------------------------------------------------------------------------*/

    clearTimeEvents() {
        for (const key in this.time_events) {
            this.clearTimeEventsOfKey(key);
        }
    }

    /*---------------------------------------------------------------------------*/

    clearTimeEventsOfKey(key) {
        //sanity check
        if (!this.time_events.hasOwnProperty(key)) {
            return;
        }
        //destroy events
        this.time_events[key].forEach(event => {
            event.destroy();
        });
    }

    /*---------------------------------------------------------------------------*/

    showCorrectSelection() {
        const cur_item = this.menu_items[this.current_idx];
        for (const item_name in this.menu_images) {
            let shown_item, hidden_item;
            const {selected, unselected} = this.menu_images[item_name];
            //show selected state in correct cases
            if (cur_item === item_name) {
                shown_item = selected;
                hidden_item = unselected;
            } else {
                shown_item = unselected;
                hidden_item = selected;
            }
            shown_item.visible = true;
            hidden_item.visible = false;
        }
    }

    /*---------------------------------------------------------------------------*/

    endPause() {
        //remove any running events
        this.clearTimeEvents();
        //remove any key tracking blocks still in effect
        this.GLOBAL.KEY_TRACKER.removeAllBlocks();
        //let phaser switch back to fight scene
        this.scene.sleep();
        this.scene.resume(FIGHT_SCENE_KEY);
    }
}