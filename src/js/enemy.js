import {BOSS_LIMITS} from "./globals";

export default class Enemy {
    constructor(id, sprite, type, scene_width, scene_height) {
        this.id = id;
        this.sprite = sprite;
        this.routines = [];
        this.cur_routine = 0;

        this.setLimits(type, scene_width, scene_height);
    }

    /*---------------------------------------------------------------------------*/

    setLimits(type, scene_width, scene_height) {
        //Object to write limits into
        this.limits = {};

        //find out factors to multiple scene width/height with to find out limits
        let multipliers;
        switch (type) {
            case 'boss':
                multipliers = BOSS_LIMITS;
                break;
            default:
                //default enemies do not have defined limits, can move anywhere
                multipliers = {
                    x_min: undefined,
                    x_max: undefined,
                    y_min: undefined,
                    y_max: undefined,
                };
                break;
        }

        //calculate limits based on scene width/height and multipliers
        ['x_min', 'x_max'].forEach(x_limit => {
            if (multipliers[x_limit] === undefined) {
                this.limits[x_limit] = undefined;
            } else {
                this.limits[x_limit] = multipliers[x_limit] * scene_width;
            }
        });
        ['y_min', 'y_max'].forEach(y_limit => {
            if (multipliers[y_limit] === undefined) {
                this.limits[y_limit] = undefined;
            } else {
                this.limits[y_limit] = multipliers[y_limit] * scene_height;
            }
        });
    }

    /*---------------------------------------------------------------------------*/

    getLimits() {
        return this.limits;
    }

    /*---------------------------------------------------------------------------*/

    addRoutine(routine) {
        this.routines.push(routine);
    }

    /*---------------------------------------------------------------------------*/

    isCurrentRoutineFinished() {
        return this.getCurrentRoutine().isFinished();
    }

    /*---------------------------------------------------------------------------*/

    existNextRoutine() {
        return this.cur_routine < this.routines.length-1;
    }

    /*---------------------------------------------------------------------------*/

    advanceRoutine() {
        this.cur_routine++;
    }

    /*---------------------------------------------------------------------------*/

    getCurrentRoutine() {
        return this.routines[this.cur_routine];
    }

    /*---------------------------------------------------------------------------*/

    getNextMoves() {
        //always returns an Object!
        return this.getCurrentRoutine().getMovesCurrentTime();
    }

    /*---------------------------------------------------------------------------*/

    disableOngoingXMovement() {
        this.getCurrentRoutine().disableOngoingXMovement();
    }

    /*---------------------------------------------------------------------------*/

    disableOngoingYMovement() {
        this.getCurrentRoutine().disableOngoingYMovement();
    }

    /*---------------------------------------------------------------------------*/

    getNextShots() {
        //returns an Array or undefined!
        return this.getCurrentRoutine().getShotsCurrentTime();
    }

    /*---------------------------------------------------------------------------*/

    applyDamage(dmg) {
        this.getCurrentRoutine().applyDamage(dmg);
    }

    /*---------------------------------------------------------------------------*/

    updateCurrentRoutine() {
        this.getCurrentRoutine().advanceTimer();
    }
}