import GLOBALS from "../Globals";
import PercentageBar from "./PercentageBar";
import {getPositionFromPercentages} from "../SpriteHelpers";

const {
    ENERGY_METER,
    BOSS_HEALTHBAR,
} = GLOBALS;

export default class UI {
    constructor(game) {
        //create boss health bar
        const boss_bar_midpoint =
            getPositionFromPercentages(BOSS_HEALTHBAR.MIDPOINT_OFFSETS, game.scale);
        this.boss_bar = new PercentageBar(game,
            boss_bar_midpoint,
            BOSS_HEALTHBAR.WIDTH,
            BOSS_HEALTHBAR.HEIGHT,
            BOSS_HEALTHBAR.BORDER_WIDTH,
            BOSS_HEALTHBAR.BG_COLOR,
            BOSS_HEALTHBAR.FILL_COLOR,
        );

        //create energy meter
        const energy_meter_midpoint =
            getPositionFromPercentages(ENERGY_METER.MIDPOINT_OFFSETS, game.scale);
        this.energy_meter = new PercentageBar(game,
            energy_meter_midpoint,
            ENERGY_METER.WIDTH,
            ENERGY_METER.HEIGHT,
            ENERGY_METER.BORDER_WIDTH,
            ENERGY_METER.BG_COLOR,
            ENERGY_METER.FILL_COLOR,
        );
    }

    /*---------------------------------------------------------------------------*/

    syncWithGameState(game_state, boss_enemy) {
        //sync boss health with boss health bar
        if (boss_enemy) {
            const health_percentage = boss_enemy.getCurrentHealthPercentage();
            this.boss_bar.draw(health_percentage);
        } else {
            this.boss_bar.hide();
        }

        //sync energy with energy meter
        const energy_percentage = game_state.getEnergyPercentage();
        this.energy_meter.draw(energy_percentage);
    }
}

