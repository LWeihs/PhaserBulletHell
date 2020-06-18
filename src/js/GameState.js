import GLOBALS from "./Globals";

const {
    PLAYER_MAX_LIVES,
} = GLOBALS;

export default class GameState {
    constructor(state_info) {
        this.switchToState(state_info);
    }

    /*---------------------------------------------------------------------------*/

    switchToState({lives, special}) {
        //live management
        if (lives) {
            this.cur_lives = lives;
        }
        if (special) {
            special.energy = 0; //also has "name" and "energy_required" fields
            this.special = special;
        }
    }

    /*---------------------------------------------------------------------------*/

    getSpecialName() {
        return this.special.name;
    }

    /*---------------------------------------------------------------------------*/

    addToLives(addend) {
        this.cur_lives += addend;
        if (this.cur_lives > PLAYER_MAX_LIVES) {
            this.cur_lives = PLAYER_MAX_LIVES;
        } else if (this.cur_lives < 0) {
            this.cur_lives = 0;
        }
    }

    /*---------------------------------------------------------------------------*/

    addEnergy(addend) {
        this.special.energy += addend;
        if (this.special.energy > this.special.energy_required) {
            this.special.energy = this.special.energy_required;
        } else if (this.special.energy < 0) {
            this.special.energy = 0;
        }
    }

    /*---------------------------------------------------------------------------*/

    isSpecialReady() {
        return this.special.energy === this.special.energy_required;
    }

    /*---------------------------------------------------------------------------*/

    getEnergyPercentage() {
        return this.special.energy / this.special.energy_required;
    }

    /*---------------------------------------------------------------------------*/

    clearEnergy() {
        this.special.energy = 0;
    }

    /*---------------------------------------------------------------------------*/

    isGameOver() {
        return this.cur_lives <= 0;
    }
}