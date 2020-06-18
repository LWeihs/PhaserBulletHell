import GLOBALS from "../Globals";
import PercentageBar from "./PercentageBar";
import {getPositionFromPercentages} from "../SpriteHelpers";

const {
    ENERGY_METER,
} = GLOBALS;

export default class UI {
    constructor(game) {
        //create energy meter
        const {x: midpoint_x, y: midpoint_y} =
            getPositionFromPercentages(ENERGY_METER.MIDPOINT_OFFSETS, game.scale);
        this.energy_meter = new PercentageBar(game,
            {x: midpoint_x, y: midpoint_y},
            ENERGY_METER.WIDTH,
            ENERGY_METER.HEIGHT,
            ENERGY_METER.BORDER_WIDTH,
            ENERGY_METER.BG_COLOR,
            ENERGY_METER.FILL_COLOR,
        );
    }

    /*---------------------------------------------------------------------------*/

    syncWithGameState(game_state) {
        //sync energy with energy meter
        const energy_percentage = game_state.getEnergyPercentage();
        this.energy_meter.draw(energy_percentage);
    }
}

