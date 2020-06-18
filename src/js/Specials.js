import GLOBALS from "./Globals";
import {divideDistXAndY} from "./GeometryHelpers";
import {moveSpriteWithinLimits} from "./SpriteHelpers";

const {
    PLAYER_BLINK_DISTANCE,
} = GLOBALS;

export default function handlePlayerSpecial(active_keys, game_state, game_limits, player) {
    //check if special can be executed
    if (!game_state.isSpecialReady()) {
        return;
    }
    const {SPECIAL: special_key_active} = active_keys;
    if (!special_key_active) {
        return;
    }
    //perform the special
    executeSpecialByName(game_state.getSpecialName(), game_limits, active_keys, player);
    //reset the game state
    game_state.clearEnergy();
}

/*---------------------------------------------------------------------------*/

function executeSpecialByName(special_name, game_limits, active_keys, player) {
    switch (special_name) {
        case 'blink':
            executeBlink(active_keys, game_limits, player);
            break;
    }
}

/*---------------------------------------------------------------------------*/

function executeBlink(active_keys, game_limits, player) {
    const {
        UP: up_active,
        DOWN: down_active,
        LEFT: left_active,
        RIGHT: right_active,
    } = active_keys;

    const blink_dir = {
        up: up_active && !down_active,
        down: down_active && !up_active,
        left: left_active && !right_active,
        right: right_active && !left_active,
    };

    //find blink degree based on direction of player movement
    let degree;
    if (blink_dir.up) {
        if (blink_dir.left) {
            degree = 225;
        } else if (blink_dir.right) {
            degree = 135;
        } else {
            degree = 180;
        }
    } else if (blink_dir.down) {
        if (blink_dir.left) {
            degree = 315;
        } else if (blink_dir.right) {
            degree = 45;
        } else {
            degree = 0;
        }
    } else if (blink_dir.left) { //neither up or down
        degree = 270;
    } else if (blink_dir.right) { //neither up or down
        degree = 90;
    } else { //no keys active
        degree = 180;
    }

    //find distances to cover with blink
    const blink_distances =
        divideDistXAndY(PLAYER_BLINK_DISTANCE, degree, false);
    //execute blink
    const opts = {
        distances: blink_distances,
        performMovement: true,
        distFromVelocities: false,
    };
    moveSpriteWithinLimits(player.getSprite(), game_limits, opts);
}