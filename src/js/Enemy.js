import {
    BOSS_LIMITS,
    BOSS_OFFSETS
} from "./Globals";
import EnemyEventTracker from "./EnemyEventTracker";
import {createRoutine} from "./JSONTranslation";
import {createMultipleShotSprites} from "./Shot";
import {
    checkSpriteXMovementPossible,
    checkSpriteYMovementPossible,
    getPositionFromPercentages,
} from "./SpriteHelpers";

export default class Enemy {
    constructor(game, {type, id: sprite_id, routines}, sprite_group) {
        this._createEventTracker(game, routines); //sets this.event_tracker
        this._createSprite(game, sprite_id, sprite_group); //sets this.sprite
        this._setMovementLimits(game, type); //sets this.limits
    }

    /*---------------------------------------------------------------------------*/

    _createEventTracker(game, routines) {
        const event_tracker = new EnemyEventTracker();
        routines.forEach(({name: routine_name}) => {
            event_tracker.addRoutine(createRoutine(game.cache.json.get(routine_name)));
        });
        this.event_tracker = event_tracker;
    }

    /*---------------------------------------------------------------------------*/

    _createSprite(game, sprite_id, sprite_group) {
        const {x, y} = getPositionFromPercentages(BOSS_OFFSETS, game.scale);
        const sprite = game.physics.add.image(x, y, sprite_id);
        sprite.setDepth(1);
        sprite_group.add(sprite);
        this.sprite = sprite;
    }

    /*---------------------------------------------------------------------------*/

    _setMovementLimits(game, type) {
        const {width: scene_width, height: scene_height} = game.scale;
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

    update(game, shot_group) {
        //transition routine, stop if all routines are done
        if (!this._handleRoutineTransition()) {
            return;
        }
        this._updateMovement();
        this._createShots(game, shot_group);
        //has to happen last, else events get gobbled
        this.event_tracker.updateCurrentRoutine();
    }

    /*---------------------------------------------------------------------------*/

    _handleRoutineTransition() {
        if (this.event_tracker.isCurrentRoutineFinished()) {
            if (this.event_tracker.existNextRoutine()) {
                this.event_tracker.advanceRoutine();
            } else {
                //TODO: enemy is done here
                return false;
            }
        }
        return true;
    }

    /*---------------------------------------------------------------------------*/

    _updateMovement() {
        let {x_acceleration,
            y_acceleration,
            x_velo,
            y_velo,
            can_leave
        } = this.event_tracker.getNextMoves();

        //ensure that random movements do stay within enemy's limits
        if (!can_leave) {
            //control x-movement
            const {possible: x_move_possible, rem: x_rem} =
                checkSpriteXMovementPossible(this.sprite, this.limits);
            if (!x_move_possible) {
                this.event_tracker.disableOngoingXMovement();
                this.sprite.x += x_rem;
                x_velo = 0;
            }
            //control y-movement
            const {possible: y_move_possible, rem: y_rem} =
                checkSpriteYMovementPossible(this.sprite, this.limits);
            if (!y_move_possible) {
                this.event_tracker.disableOngoingYMovement();
                this.sprite.y += y_rem;
                y_velo = 0;
            }
        }

        //set new movement
        this.sprite.setVelocityX(x_velo);
        this.sprite.setVelocityY(y_velo);
        this.sprite.setAccelerationX(x_acceleration);
        this.sprite.setAccelerationY(y_acceleration);
    }

    /*---------------------------------------------------------------------------*/

    _createShots(game, shot_group) {
        const next_shots = this.event_tracker.getNextShots();
        if (!next_shots) {
            return;
        }
        createMultipleShotSprites(game, next_shots, this.sprite, shot_group);
    }
}