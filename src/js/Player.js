import {divideDistXAndY} from "./geometry_helpers";
import {getPositionFromPercentages} from "./SpriteHelpers";
import {createMultipleShotSprites} from "./Shot";
import {PLAYER_OFFSETS} from "./globals";

export default class Player {
    constructor({asset_folder, weapon, movement, invincibility_window, lives}) {
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
            remaining: 0,
        };
        this.cur_lives = lives;
        //properties to fill
        this.sprite = null;
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

    update(game, active_keys) {
        this._updateMovement(active_keys);
        const created_shots = this._createShots(game, active_keys);
        //return info on created physics entities during update step
        return {
            shots: created_shots,
        }
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

    _createShots(game, active_keys) {
        const {FIRE: fire_btn_active} = active_keys;
        if (fire_btn_active) {
            if (this.weapon.cooldown <= 0) {
                this.weapon.cooldown = this.weapon.fire_rate;
                return createMultipleShotSprites(game, this.weapon.shots, this.sprite);
            } else {
                this.weapon.cooldown--;
            }
        }
        return [];
    }
}