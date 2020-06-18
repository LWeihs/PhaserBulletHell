import GLOBALS from "./Globals";
import {createMultipleShotSprites} from "./Shot";
import {getPositionFromPercentages} from "./SpriteHelpers";

const {
    PLAYER_OFFSETS,
} = GLOBALS;

export default class Player {
    constructor({asset_folder, weapon, movement, invincibility_window}) {
        //inferred properties
        this.asset_folder = asset_folder;
        this.weapon = {
            fire_rate: weapon.fire_rate,
            shots: weapon.shots,
            cooldown: 0,
        };
        this.movement = movement; //normal, slowed
        this.invis_frames = {
            max: invincibility_window,
            active: false,
        };
        //properties to fill
        this.sprite = null;
    }

    /*---------------------------------------------------------------------------*/

    getSprite() {
        return this.sprite;
    }

    /*---------------------------------------------------------------------------*/

    isInvincible() {
        return this.invis_frames.active;
    }

    /*---------------------------------------------------------------------------*/

    create(game) {
        const {x: player_x, y: player_y} =
            getPositionFromPercentages(PLAYER_OFFSETS, game.scale);
        const player_sprite = game.physics.add.image(player_x, player_y, 'player_sprite');
        player_sprite.setCollideWorldBounds(true);
        player_sprite.setDepth(1);
        this.sprite = player_sprite;
        return player_sprite;
    }

    /*---------------------------------------------------------------------------*/

    update(game, active_keys, shot_group) {
        this._updateMovement(active_keys);
        this._createShots(game, active_keys, shot_group);
    }

    /*---------------------------------------------------------------------------*/

    _updateMovement(active_keys) {
        const {
            UP: up_active,
            DOWN: down_active,
            LEFT: left_active,
            RIGHT: right_active,
            SLOW: slow_active,
        } = active_keys;

        //determine player speed
        const speed = slow_active ? this.movement.slowed : this.movement.normal;

        //set velocity based on speed and active movement keys
        let x_velo = 0, y_velo = 0;
        if (up_active) {
            y_velo -= speed;
        }
        if (down_active) {
            y_velo += speed;
        }
        if (left_active) {
            x_velo -= speed;
        }
        if (right_active) {
            x_velo += speed;
        }
        this.sprite.setVelocityX(x_velo);
        this.sprite.setVelocityY(y_velo);
    }

    /*---------------------------------------------------------------------------*/

    _createShots(game, active_keys, shot_group) {
        const {FIRE: fire_btn_active} = active_keys;
        if (fire_btn_active) {
            if (this.weapon.cooldown <= 0) {
                this.weapon.cooldown = this.weapon.fire_rate;
                createMultipleShotSprites(game, this.weapon.shots, this.sprite,
                    shot_group);
            } else {
                this.weapon.cooldown--;
            }
        }
    }

    /*---------------------------------------------------------------------------*/

    triggerInvincibility(game) {
        this.invis_frames.active = true;
        game.time.addEvent({
            delay: this.invis_frames.max,
            callback: () => {
                this.invis_frames.active = false;
            },
        });
    }
}