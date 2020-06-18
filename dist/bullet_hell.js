(function (factory) {
    typeof define === 'function' && define.amd ? define(factory) :
    factory();
}((function () { 'use strict';

    const GLOBALS = {
        /** SCENE KEYS **/
        BOOT_1_SCENE_KEY: 'boot1',
        BOOT_2_SCENE_KEY: 'boot2',
        FIGHT_SCENE_KEY: 'fight',
        PAUSE_SCENE_KEY: 'pause',
        KEY_TRACKER_KEY: 'key_tracker',

        /** KEY BINDINGS **/
        KEY_BINDINGS: {
            //player movement
            UP: {type: 'cursor', key: 'up'},
            DOWN: {type: 'cursor', key: 'down'},
            LEFT: {type: 'cursor', key: 'left'},
            RIGHT: {type: 'cursor', key: 'right'},
            //player actions
            SLOW: {type: 'cursor', key: 'shift'},
            FIRE: {type: 'keyboard', key: 'Y'},
            SPECIAL: {type: 'keyboard', key: 'X'},
            //general
            PAUSE: {type: 'keyboard', key: 'ESC'},
            ENTER: {type: 'keyboard', key: 'ENTER'},
        },

        /** BACKGROUNDS **/

        BACKGROUND_ALPHA: 0.5,

        /** PAUSE MENU **/

        PAUSE_INPUT_DEBOUNCE_INITIAL_MS: 500,
        PAUSE_INPUT_DEBOUNCE_QUICK_MS: 250,
        PAUSE_OVERLAY_ALPHA: 0.94,
        PAUSE_MENU_UPPER_LEFT: {
            x: 1 / 20,
            y: 6 / 10,
        },
        PAUSE_MENU_Y_OFFSET: 1 / 100,

        /** POSITIONING **/

        PLAYER_OFFSETS: {
            x: 1 / 2,
            y: 9 / 10,
        },
        BOSS_OFFSETS: {
            x: 1 / 2,
            y: 1 / 10,
        },
        BOSS_LIMITS: {
            x_min: 0,
            x_max: 1,
            y_min: 0,
            y_max: 0.42,
        },

        /** FOLDER STRUCTURE **/

        ASSET_PATH: 'assets',
        MENU_ASSETS_FOLDER: 'menu',
        PLAYER_JSON_PATH: 'player',
        LEVEL_JSON_PATH: 'levels',

        /** PLAYER INFORMATION (SAME BETWEEN ALL PLAYERS) **/

        INVIS_FRAMES_AFTER_HIT: 60,
        ENERGY_PASSIVE_ACCUMULATION: 2,
        ENERGY_ACCUMULATION_INTERVAL: 100, //ms

        /** PLAYER SPECIALS **/

        PLAYER_BLINK_DISTANCE: 300,

        /** GAME STATE INFORMATION **/

        PLAYER_MAX_LIVES: 99,

        /** UI **/
        ENERGY_METER: {
            MIDPOINT_OFFSETS: {
                x: 1 / 2,
                y: 29 / 30,
            },
            WIDTH: 400,
            HEIGHT: 20,
            BG_COLOR: 0xffcccc,
            FILL_COLOR: 0x29a329,
            BORDER_WIDTH: 4,
        },

        BOSS_HEALTHBAR: {
            MIDPOINT_OFFSETS: {
                x: 1 / 2,
                y: 1 / 30,
            },
            WIDTH: 1000,
            HEIGHT: 40,
            BG_COLOR: 0xffcccc,
            FILL_COLOR: 0xcc0000,
            BORDER_WIDTH: 4,
        }
    };

    const {
        PLAYER_MAX_LIVES,
    } = GLOBALS;

    class GameState {
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

    function divideDistXAndY(dist, angle, isRadian = true) {
        angle = isRadian ? angle : degreeToRadian(angle);
        return {
            x: dist * Math.sin(angle),
            y: dist * Math.cos(angle),
        };
    }

    /*---------------------------------------------------------------------------*/

    function degreeToRadian(degree) {
        return degree * Math.PI/180;
    }

    /*---------------------------------------------------------------------------*/

    function getRectBorders({x, y, width, height}) {
        return {
            x_min: x,
            x_max: x + width,
            y_min: y,
            y_max: y + height,
        }
    }

    /*---------------------------------------------------------------------------*/

    function getRectBordersFromMidpoint(midpoint, width, height) {
        return {
            x_min: midpoint.x - width/2,
            x_max: midpoint.x + width/2,
            y_min: midpoint.y - height/2,
            y_max: midpoint.y + height/2,
        }
    }

    class PercentageBar {
        constructor(game, midpoint, width, height, border_width, bg_color, fill_color) {
            //the Object to render with
            this.bar = game.add.graphics();

            //describe the parts of the health bar
            const {x_min, y_min} = getRectBordersFromMidpoint(midpoint, width, height);
            this.outer_rect = {
                x: x_min,
                y: y_min,
                width: width,
                height: height,
            };
            this.inner_rect = { //the rect to show the meter in percent
                x: x_min + border_width,
                y: y_min + border_width,
                width: width - border_width*2,
                height: height - border_width*2,
            };

            //cache the colors to use for the outer/inner rect
            this.bg_color = bg_color;
            this.fill_color = fill_color;
        }

        /*---------------------------------------------------------------------------*/

        draw(percentage) {
            this.bar.clear();

            //draw outer rectangle
            this.bar.fillStyle(this.bg_color);
            this.bar.fillRect(this.outer_rect.x, this.outer_rect.y, this.outer_rect.width,
                this.outer_rect.height);

            //draw inner rectangle based on given percentage
            this.bar.fillStyle(this.fill_color);
            const fill_width = this.inner_rect.width * percentage;
            this.bar.fillRect(this.inner_rect.x, this.inner_rect.y, fill_width,
                this.inner_rect.height);
        }

        /*---------------------------------------------------------------------------*/

        hide() {
            this.bar.clear();
        }
    }

    function moveSpriteWithinLimits(sprite, limits, {distances, distFromVelocities, performMovement}) {
        //log if further movement in this direction is possible
        const res = {
            x: true,
            y: true,
        };

        //infer distances from velocities if so desired
        if (distFromVelocities) {
            distances = {
                x: getSpriteDxPerFrame(sprite),
                y: getSpriteDyPerFrame(sprite),
            };
        }

        //control x-movement
        const {possible: x_move_possible, rem: x_rem} =
            checkSpriteXMovementPossible(sprite, limits, distances.x);
        if (!x_move_possible) {
            sprite.x += x_rem;
            res.x = false;
        } else if (performMovement) { //x-move possible
            sprite.x += distances.x;
        }
        //control y-movement
        const {possible: y_move_possible, rem: y_rem} =
            checkSpriteYMovementPossible(sprite, limits, distances.y);
        if (!y_move_possible) {
            sprite.y += y_rem;
            res.y = false;
        } else if (performMovement) {
            sprite.y += distances.y;
        }

        return res;
    }

    /*---------------------------------------------------------------------------*/

    function checkSpriteXMovementPossible(sprite, {x_min, x_max}, dx) {
        const res = {
            possible: true,
            rem: undefined, //remaining available move space
        };
        if (dx < 0) {
            res.rem = -calcDistanceSpriteToLimitLeft(sprite, x_min);
            if (dx < res.rem) {
                res.possible = false;
            }
        } else if (dx > 0) {
            res.rem = calcDistanceSpriteToLimitRight(sprite, x_max);
            if (dx > res.rem) {
                res.possible = false;
            }
        }
        return res;
    }

    /*---------------------------------------------------------------------------*/

    function checkSpriteYMovementPossible(sprite, {y_min, y_max}, dy) {
        const res = {
            possible: true,
            rem: undefined, //remaining available move space
        };
        if (dy < 0) {
            res.rem = -calcDistanceSpriteToLimitUp(sprite, y_min);
            if (dy < res.rem) {
                res.possible = false;
            }
        } else if (dy > 0) {
            res.rem = calcDistanceSpriteToLimitDown(sprite, y_max);
            if (dy > res.rem) {
                res.possible = false;
            }
        }
        return res;
    }

    /*---------------------------------------------------------------------------*/

    function calcDistanceSpriteToLimitLeft(sprite, x_min) {
        return sprite.x - sprite.body.halfWidth - x_min;
    }

    /*---------------------------------------------------------------------------*/

    function calcDistanceSpriteToLimitRight(sprite, x_max) {
        return x_max - (sprite.x + sprite.body.halfWidth);
    }

    /*---------------------------------------------------------------------------*/

    function calcDistanceSpriteToLimitUp(sprite, y_min) {
        return sprite.y - sprite.body.halfHeight - y_min;
    }

    /*---------------------------------------------------------------------------*/

    function calcDistanceSpriteToLimitDown(sprite, y_max) {
        return y_max - (sprite.y + sprite.body.halfHeight);
    }

    /*---------------------------------------------------------------------------*/

    function getSpriteDxPerFrame(sprite) {
        return sprite.body._dx;
    }

    /*---------------------------------------------------------------------------*/

    function getSpriteDyPerFrame(sprite) {
        return sprite.body._dy;
    }

    /*---------------------------------------------------------------------------*/

    function getPositionFromPercentages({x: percentage_x, y: percentage_y},
                                        {width: scene_width, height: scene_height}) {
        return {
            x: percentage_x * scene_width,
            y: percentage_y * scene_height,
        };
    }

    const {
        ENERGY_METER,
        BOSS_HEALTHBAR,
    } = GLOBALS;

    class UI {
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

    function createMultipleShotSprites(game, shot_infos, reference, shot_group) {
        shot_infos.forEach(shot_info => {
            createShotSprite(game, shot_info, reference, shot_group);
        });
    }

    /*---------------------------------------------------------------------------*/

    function createShotSprite(game, shot_info, reference, shot_group) {
        let {
            shot_id, //ID of the shot image (in game's cache)
            x_offset, //x-offset from reference
            y_offset, //y-offset from reference
            anchor, //side (or middle) of reference to anchor shot to

            damage, //the damage the shot causes

            //-- multiple alternatives to express shot's velocity --

            //ALTERNATIVE 1
            x_velo, //the shot's velocity in x-direction
            y_velo, //the shot's velocity in y-direction

            //ALTERNATIVE 2
            degree, //degree (from start point) to angle shot at
            speed, //speed to divide into x- and y-velocity
        } = shot_info;
        const {
            x: ref_x,
            y: ref_y,
            width: ref_width,
            height: ref_height,
        } = reference;

        //find placement of shot based on given information
        let shot_x = ref_x + x_offset;
        let shot_y = ref_y + y_offset;
        switch(anchor) {
            case 'Top':
                shot_y -= ref_height/2;
                break;
            case 'Bottom':
                shot_y += ref_height/2;
                break;
            case 'Left':
                shot_x -= ref_width/2;
                break;
            case 'Right':
                shot_x += ref_width/2;
                break;
        }

        //create the shot as physics image in the game world at placement
        const shot = game.physics.add.image(shot_x, shot_y, shot_id);
        //cache the damage directly on the sprite Object
        if (damage) {
            shot.damage = damage;
        }

        //add shot to given physics group BEFORE setting velocity
        if (shot_group) {
            shot_group.add(shot);
        }

        //find values to use for x- and y-velocity of shot
        if (x_velo === undefined) {
            //ALTERNATIVE 2
            ({x: x_velo, y: y_velo} = divideDistXAndY(speed, degree, false));
        }
        shot.setVelocityX(x_velo);
        shot.setVelocityY(y_velo);
    }

    const {
        PLAYER_OFFSETS,
    } = GLOBALS;

    class Player {
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

    class EnemyEventTracker {
        constructor() {
            this.routines = [];
            this.cur_routine = 0;
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

        getRoutineHealthPercentage() {
            return this.getCurrentRoutine().getHealthPercentage();
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

    function getEntryModulo(arr, i) {
        return arr[i % arr.length];
    }

    /*---------------------------------------------------------------------------*/

    function makeArrayFromIntervals(start, end, interval) {
        const arr = [];
        let cur = start;
        while (cur <= end) {
            arr.push(cur);
            cur += interval;
        }
        return arr;
    }

    class Routine {
        constructor({name, loops, duration, hp}) {
            this.name = name;
            this.loops = loops;
            this.duration = duration;
            this.has_hp = (hp !== undefined);
            this.max_hp = hp;
            this.cur_hp = hp;

            this.moves = {};
            this.shots = {};
            this.time = 0;

            this.ongoing_movement = {
                x_acceleration: 0,
                y_acceleration: 0,
                x_velo: 0,
                y_velo: 0,
                can_leave: true,
            };
        }

        /*---------------------------------------------------------------------------*/

        applyDamage(dmg) {
            if (this.has_hp) {
                this.cur_hp -= dmg;
                if (this.cur_hp < 0) {
                    this.cur_hp = 0;
                }
            }
        }

        /*---------------------------------------------------------------------------*/

        getHealthPercentage() {
            return this.cur_hp / this.max_hp;
        }

        /*---------------------------------------------------------------------------*/

        advanceTimer() {
            this.time++;
            if (this.loops && this.time > this.duration) {
                this.time = 0;
            }
        }

        /*---------------------------------------------------------------------------*/

        isFinished() {
            return (this.time > this.duration) || (this.has_hp && this.cur_hp <= 0);
        }

        /*---------------------------------------------------------------------------*/

        addMovesByDescription(move_desc) {
            switch (move_desc.type) {
                case 'Stop':
                    this.addStopMoves(move_desc.times);
                    break;
                case 'Randomized':
                    this.addMovesFromRandomizedMoves(move_desc);
                    break;
                case 'Fixed':
                default:
                    this.addMovesFromFixedMoves(move_desc);
                    break;
            }
        }

        /*---------------------------------------------------------------------------*/

        addMovesFromFixedMoves(fixed_moves_desc) {
            fixed_moves_desc.can_leave = true;
            const move = this.reduceMoveDescToMove(fixed_moves_desc);
            fixed_moves_desc.times.forEach(time => {
                this.addSingleMove(move, time);
            });
        }

        /*---------------------------------------------------------------------------*/

        addMovesFromRandomizedMoves(rnd_moves_desc) {
            rnd_moves_desc.can_leave = false;
            const move = this.reduceMoveDescToMove(rnd_moves_desc);
            rnd_moves_desc.times.forEach(time => {
                this.addSingleMove(move, time);
            });
        }

        /*---------------------------------------------------------------------------*/

        addStopMoves(times) {
            const stop_move = {
                type: 'Fixed', //for switch in Scenes
                x_acceleration: 0,
                y_acceleration: 0,
                x_velo: 0,
                y_velo: 0,
                can_leave: true, //should be irrelevant
            };
            times.forEach(time => {
                this.addSingleMove(stop_move, time);
            });
        }

        /*---------------------------------------------------------------------------*/

        reduceMoveDescToMove(move_desc) {
            const red_desc = Object.assign({}, move_desc);
            delete red_desc.times;
            return red_desc;
        }

        /*---------------------------------------------------------------------------*/

        //move must have: x_acceleration, y_acceleration, x_velo, y_velo
        addSingleMove(move, time) {
            this.moves[time] = move;
        }

        /*---------------------------------------------------------------------------*/

        getMovesCurrentTime() {
            const new_move_info = this.moves[this.time];
            if (new_move_info) {
                switch (new_move_info.type) {
                    case 'Fixed':
                        this.setOngoingMovement(new_move_info);
                        break;
                    case 'Randomized':
                        this.setOngoingMovementFromRandom(new_move_info);
                }
            }
            return this.ongoing_movement;
        }

        /*---------------------------------------------------------------------------*/

        setOngoingMovementFromRandom(move_info) {
            //determine x_velo and y_velo to be used at this time
            const {x_velo_range, y_velo_range} = move_info;
            move_info.x_velo = Phaser.Math.Between(x_velo_range[0], x_velo_range[1]);
            move_info.y_velo = Phaser.Math.Between(y_velo_range[0], y_velo_range[1]);
            //transfer info to tracked ongoing movement
            this.setOngoingMovement(move_info);
        }

        /*---------------------------------------------------------------------------*/

        setOngoingMovement(move_info) {
            //reduce given info to properties shown to outside
            this.ongoing_movement = {
                x_acceleration: move_info.x_acceleration,
                y_acceleration: move_info.y_acceleration,
                x_velo: move_info.x_velo,
                y_velo: move_info.y_velo,
                can_leave: move_info.can_leave,
            };
        }

        /*---------------------------------------------------------------------------*/

        disableOngoingXMovement() {
            this.ongoing_movement.x_acceleration = 0;
            this.ongoing_movement.x_velo = 0;
        }

        /*---------------------------------------------------------------------------*/

        disableOngoingYMovement() {
            this.ongoing_movement.y_acceleration = 0;
            this.ongoing_movement.y_velo = 0;
        }

        /*---------------------------------------------------------------------------*/

        addShotsByDescription(shot_desc) {
            switch(shot_desc.type) {
                case 'ShotArray':
                    this.addShotsFromShotArray(shot_desc);
                    break;
                case 'ShotRow':
                    this.addShotsFromShotRow(shot_desc);
                    break;
                case 'ShotCircle':
                    this.addShotsFromShotCircle(shot_desc);
                    break;
                case 'ShotTwister':
                    this.addShotsFromShotTwister(shot_desc);
                    break;
            }
        }

        /*---------------------------------------------------------------------------*/

        addShotsFromShotArray(shot_arr_desc) {
            const {times, shots, anchor} = shot_arr_desc;
            shots.forEach(shot => {
                times.forEach(time => {
                    this.addSingleShot(shot, time, anchor);
                });
            });
        }

        /*---------------------------------------------------------------------------*/

        addShotsFromShotRow(shot_row_desc) {
            let {nr_shots, //dictates the shot density
                anchor, //where to anchor the full row on the enemy asset
                shot_ids, //the asset ids of individual shots
                speeds, //the speeds of individual shots
                degrees, //the degrees of individual shots
                x_offset_start, //placed along line from this x
                x_offset_end, //placed along line to this x
                y_offset, //offset in y-direction
                continuous, //if shots are to be repeated
                times, //cont = false => individual shot appearance times
                interval, //cont = true => interval in which shots appear
                start_time, //cont = true => time at which to start interval
            } = shot_row_desc;

            //find out at which times individual shots spawn
            if (continuous) {
                times = makeArrayFromIntervals(start_time, this.duration, interval);
            }
            //find out x-distance between shots
            const x_dist = x_offset_end - x_offset_start;
            const x_interval = x_dist / nr_shots;

            //create individual shots
            for (let i=0; i<nr_shots; ++i) {
                const shot = {
                    shot_id: getEntryModulo(shot_ids, i),
                    speed: getEntryModulo(speeds, i),
                    degree: getEntryModulo(degrees, i),
                    x_offset: x_offset_start + x_interval * i,
                    y_offset: y_offset
                };
                times.forEach(time => {
                    this.addSingleShot(shot, time, anchor);
                });
            }
        }

        /*---------------------------------------------------------------------------*/

        addShotsFromShotCircle(shot_circle_desc) {
            let {nr_shots, //dictates the shot density
                anchor, //where to anchor the full row on the enemy asset
                shot_ids, //the asset ids of individual shots
                speeds, //the speeds of individual shots
                shot_spread, //whether shot's movement should follow their spawn degree
                degrees, //shot_spread = false => the degrees of individual shots
                x_offset, //offset in x-direction
                y_offset, //offset in y-direction
                continuous, //if shots are to be repeated
                times, //cont = false => individual shot appearance times
                interval, //cont = true => interval in which shots appear
                start_time, //cont = true => time at which to start interval
                start_degree, //at which degree (of circle) to place first shot
                end_degree, //at which degree (of circle) to place last shot
                radius, //distance from middle of circle to individual shots
            } = shot_circle_desc;

            //find out at which times individual shots spawn
            if (continuous) {
                times = makeArrayFromIntervals(start_time, this.duration, interval);
            }
            //find out degree interval between shots
            start_degree = (start_degree !== undefined) ? start_degree : 0;
            end_degree = (end_degree !== undefined) ? end_degree : 360;
            const degree_diff = end_degree - start_degree;
            const degree_interval = degree_diff / nr_shots;

            //create individual shots
            for (let i=0; i<nr_shots; ++i) {
                //determine where shot spawns
                const spawn_degree = start_degree + degree_interval*i;
                const {x: x_offset_circle, y: y_offset_circle} =
                    divideDistXAndY(radius, spawn_degree, false);
                //determine shot movement
                const shot_degree = shot_spread
                    ? spawn_degree
                    : getEntryModulo(degrees, i);
                //build the shot
                const shot = {
                    shot_id: getEntryModulo(shot_ids, i),
                    speed: getEntryModulo(speeds, i),
                    degree: shot_degree,
                    x_offset: x_offset + x_offset_circle,
                    y_offset: y_offset + y_offset_circle,
                };
                //add shot at expected times
                times.forEach(time => {
                    this.addSingleShot(shot, time, anchor);
                });
            }
        }

        /*---------------------------------------------------------------------------*/

        addShotsFromShotTwister(shot_twister_desc) {
            let {
                anchor,
                x_offset,
                y_offset,
                speeds,
                start_degree,
                finish_degree,
                direction,
                degree_offset,
                shot_ids,
                start_time,
                time_interval,
                radius,
                continuous,
                repeat_interval
            } = shot_twister_desc;

            //infer number of shots to create
            const degree_diff = finish_degree - start_degree;
            const nr_shots = Math.floor(degree_diff/degree_offset);
            if (nr_shots <= 0) {
                return;
            }

            //infer full time of twister (until all shots are dealt with)
            const full_time = (nr_shots-1) * time_interval;

            //infer direction multiplier
            const dir_multiplier = (direction === 'clockwise') ? 1 : -1;

            //set degree and time of first twister shot
            let cur_degree = start_degree;
            let cur_time = start_time;

            //create individual shots
            for (let i=0; i<nr_shots; ++i) {
                //determine where shot spawns
                const {x: x_offset_circle, y: y_offset_circle} =
                    divideDistXAndY(radius, cur_degree, false);
                //build the shot
                const shot = {
                    shot_id: getEntryModulo(shot_ids, i),
                    speed: getEntryModulo(speeds, i),
                    degree: cur_degree,
                    x_offset: x_offset + x_offset_circle,
                    y_offset: y_offset + y_offset_circle,
                };
                //find times when shot should be created
                let times = [];
                if (continuous) {
                    let next_time = cur_time;
                    while (next_time < this.duration) {
                        times.push(next_time);
                        next_time += (full_time + repeat_interval);
                    }
                } else {
                    times.push(cur_time);
                }

                //add shots at expected times
                times.forEach(time =>  {
                    this.addSingleShot(shot, time, anchor);
                });


                //update next position and next shot spawn time
                cur_degree += dir_multiplier * degree_offset;
                cur_time += time_interval;
            }
        }

        /*---------------------------------------------------------------------------*/

        addSingleShot({shot_id, speed, degree, x_offset, y_offset}, time, anchor) {
            //translate given speed and degree into usable velocities
            const {x: x_velo, y: y_velo} = divideDistXAndY(speed, degree, false);
            //make shot entry
            if (!this.shots.hasOwnProperty(time)) {
                this.shots[time] = [];
            }
            this.shots[time].push({
                shot_id: shot_id,
                x_offset: x_offset,
                y_offset: y_offset,
                anchor: anchor,
                x_velo: x_velo,
                y_velo: y_velo,
            });
        }

        /*---------------------------------------------------------------------------*/

        getShotsCurrentTime() {
            //undefined or shots
            return this.shots[this.time];
        }
    }

    function createRoutine(info) {
        const routine = new Routine(info);
        info.moves && info.moves.forEach(move_desc => {
            routine.addMovesByDescription(move_desc);
        });
        info.shots && info.shots.forEach(shot_desc => {
            routine.addShotsByDescription(shot_desc);
        });
        return routine;
    }

    const {
        BOSS_LIMITS,
        BOSS_OFFSETS
    } = GLOBALS;

    class Enemy {
        constructor(id, game, {type, id: sprite_id, routines}, sprite_group) {
            this.id = id;
            this.type = type;
            this._createEventTracker(game, routines); //sets this.event_tracker
            this._createSprite(id, game, sprite_id, sprite_group); //sets this.sprite
            this._setMovementLimits(game, type); //sets this.limits
        }

        /*---------------------------------------------------------------------------*/

        applyDamage(dmg) {
            this.event_tracker.applyDamage(dmg);
        }

        /*---------------------------------------------------------------------------*/

        getCurrentHealthPercentage() {
            return this.event_tracker.getRoutineHealthPercentage();
        }

        /*---------------------------------------------------------------------------*/

        destroySprite() {
            this.sprite.destroy();
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

        _createSprite(id, game, sprite_id, sprite_group) {
            const {x, y} = getPositionFromPercentages(BOSS_OFFSETS, game.scale);
            const sprite = game.physics.add.image(x, y, sprite_id);
            //log unique enemy ID directly on the sprite Object
            sprite.id = id;
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
            const update_info = {
                destroy: false,
            };
            //transition routine, stop if all routines are done
            if (!this._handleRoutineTransition()) {
                update_info.destroy = true;
                return update_info;
            }
            this._updateMovement();
            this._createShots(game, shot_group);
            //has to happen last, else events get gobbled
            this.event_tracker.updateCurrentRoutine();

            return update_info;
        }

        /*---------------------------------------------------------------------------*/

        _handleRoutineTransition() {
            if (this.event_tracker.isCurrentRoutineFinished()) {
                if (this.event_tracker.existNextRoutine()) {
                    this.event_tracker.advanceRoutine();
                } else {
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
                const {
                    x: x_move_possible,
                    y: y_move_possible,
                } = moveSpriteWithinLimits(
                    this.sprite,
                    this.limits,
                    {
                        distFromVelocities: true,
                    },
                );

                //control x-movement
                if (!x_move_possible) {
                    this.event_tracker.disableOngoingXMovement();
                    x_velo = 0;
                }
                //control y-movement
                if (!y_move_possible) {
                    this.event_tracker.disableOngoingYMovement();
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

    const {
        ASSET_PATH,
    } = GLOBALS;

    /*---------------------------------------------------------------------------*/

    function makeAssetPath(suffix) {
        return `${ASSET_PATH}/${suffix}`;
    }

    const {
        BACKGROUND_ALPHA,
    } = GLOBALS;

    /**
     * Based on level info JSON.
     */
    class Background {
        constructor(bg_info) {
            this.asset_folder = bg_info.folder;
            this.parallaxes = bg_info.parallaxes;
        }

        /*---------------------------------------------------------------------------*/

        preload(game, asset_map) {
            this.parallaxes.forEach(({background_id: img_id}) => {
                const img_path = makeAssetPath(`${this.asset_folder}/${asset_map[img_id]}`);
                game.load.image(img_id, img_path);
            });
        }

        /*---------------------------------------------------------------------------*/

        create(game) {
            this.parallaxes.forEach(parallax => {
                this._createParallax(game, parallax);
            });
        }

        /*---------------------------------------------------------------------------*/

        _createParallax(game, parallax) {
            const img_id = parallax.background_id;
            const {height: scene_height} = game.scale;
            //get the loaded image and its width
            const img = game.textures.get(img_id);
            const {width: bg_width} = img.frames.__BASE;
            //create and cache the parallax tile sprite
            const tile_sprite = game.add.tileSprite(bg_width / 2,
                scene_height / 2,
                bg_width,
                scene_height,
                img_id
            );
            tile_sprite.setAlpha(BACKGROUND_ALPHA);
            parallax.tile_sprite = tile_sprite;
        }

        /*---------------------------------------------------------------------------*/

        update() {
            this.parallaxes.forEach(({tile_sprite, scroll_speed_x, scroll_speed_y}) => {
                if (scroll_speed_x) {
                    tile_sprite.tilePositionX -= scroll_speed_x;
                }
                if (scroll_speed_y) {
                    tile_sprite.tilePositionY -= scroll_speed_y;
                }
            });
        }
    }

    function handleHitPlayer(game, player, game_state) {
        if (player.isInvincible()) {
            return;
        }
        game_state.addToLives(-1);
        player.triggerInvincibility(game);
    }

    /*---------------------------------------------------------------------------*/

    function handleEnemyHit(bullet_sprite, enemy) {
        enemy.applyDamage(bullet_sprite.damage);
        bullet_sprite.destroy();
    }

    const {
        PLAYER_BLINK_DISTANCE,
    } = GLOBALS;

    function handlePlayerSpecial(active_keys, game_state, game_limits, player) {
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

    const {
        FIGHT_SCENE_KEY,
        PAUSE_SCENE_KEY,
        ENERGY_ACCUMULATION_INTERVAL,
        ENERGY_PASSIVE_ACCUMULATION,
    } = GLOBALS;

    //level progression
    let timer = 0;
    const enemy_events = {};

    class FightScene extends Phaser.Scene {
        constructor() {
            super({
                key: FIGHT_SCENE_KEY,
            });
        }

        /*---------------------------------------------------------------------------*/

        init(global_data) {
            //limits of game area in which elements may move
            this.limits = getRectBorders({
                x: 0,
                y: 0,
                width: this.scale.width,
                height: this.scale.height,
            });

            //get relevant JSON data
            const level_base_info = this.cache.json.get('level_base_info');
            const player_info = this.cache.json.get('player_info');

            //global data carried between scenes
            this.GLOBAL = global_data;

            //game state to track lives, energy meter
            this.game_state = new GameState(player_info);

            //UI to signal game state to player
            this.UI = new UI(this);

            //management of the player sprite
            this.player = new Player(player_info);

            //management of the (parallax) background
            this.background = new Background(level_base_info.background);

            //management of currently active enemy sprites/routines
            this.active_boss = null;
            this.active_enemies = {}; //by their unique ID
            this.next_enemy_id = 0; //simply increment up on enemy creation
        }

        /*---------------------------------------------------------------------------*/

        getEnemyById(id) {
            return this.active_enemies[id];
        }

        /*---------------------------------------------------------------------------*/

        preload () {
            this.preloadLevelAssets();
            this.setUpEventTimeline();

            //player
            const player_info = this.cache.json.get('player_info');
            const {asset_folder} = player_info;
            this.load.image('player_sprite', makeAssetPath(`${asset_folder}/sprite.png`));
            this.load.image('player_bullet', makeAssetPath(`${asset_folder}/bullet.png`));

            //background
            const asset_map = this.cache.json.get('level_asset_info');
            this.background.preload(this, asset_map);
        }

        /*---------------------------------------------------------------------------*/

        preloadLevelAssets() {
            Object.entries(this.cache.json.get('level_asset_info'))
                .forEach(([key, file_path]) => {
                this.load.image(key, makeAssetPath(file_path));
            });
        }

        /*---------------------------------------------------------------------------*/

        setUpEventTimeline() {
            this.cache.json.get('level_event_info').forEach(event_info => {
                switch(event_info.type) {
                    case 'enemy':
                        this.addEnemyEvent(event_info);
                        break;
                }
            });
        }

        /*---------------------------------------------------------------------------*/

        addEnemyEvent({time, id}) {
            if (!enemy_events.hasOwnProperty(time)) {
                enemy_events[time] = [];
            }
            enemy_events[time].push(id);
        }

        /*---------------------------------------------------------------------------*/

        create () {
            //background
            this.background.create(this);

            //UI
            this.UI.syncWithGameState(this.game_state, this.active_boss);

            //player setup
            this.player_sprite = this.player.create(this);

            this._setUpCollisionHandling();

            //start repeating timers
            this._startRepeatingTimer(ENERGY_ACCUMULATION_INTERVAL, () => {
                this.game_state.addEnergy(ENERGY_PASSIVE_ACCUMULATION);
            });
        }

        /*---------------------------------------------------------------------------*/

        _setUpCollisionHandling() {
            //collision groups for enemies and bullets
            this.player_bullets = this.physics.add.group();
            this.enemy_bullets = this.physics.add.group();
            this.deadly_enemies = this.physics.add.group();

            //player collision handling
            const player_hit = () => {
                handleHitPlayer(this, this.player, this.game_state);
            };
            this.physics.add.overlap(this.player_sprite, this.deadly_enemies, player_hit);
            this.physics.add.overlap(this.player_sprite, this.enemy_bullets, player_hit);

            //enemy collision handling
            const enemy_hit = (bullet_sprite, enemy_sprite) => {
                const enemy = this.getEnemyById(enemy_sprite.id);
                handleEnemyHit(bullet_sprite, enemy);
            };
            this.physics.add.overlap(this.player_bullets, this.deadly_enemies, enemy_hit);
        }

        /*---------------------------------------------------------------------------*/

        _startRepeatingTimer(delay, callback) {
            const start_timer = () => {
                this.time.addEvent({
                    delay: delay,
                    callback: () => {
                        callback();
                        start_timer();
                    },
                });
            };
            start_timer();
        }

        /*---------------------------------------------------------------------------*/

        update() {
            //check for game interruptions
            this.pauseGameIfRequested();

            //divide update step into sub-steps of game elements

            //get necessary variables
            const active_keys = this.GLOBAL.KEY_TRACKER.active_keys;

            //background
            this.background.update();

            //UI
            this.UI.syncWithGameState(this.game_state, this.active_boss);

            //player
            this.player.update(this, active_keys, this.player_bullets);
            handlePlayerSpecial(active_keys, this.game_state, this.limits, this.player);

            //enemies by timeline
            this.createNewEnemies();
            Object.values(this.active_enemies).forEach(enemy => {
                const {destroy} = enemy.update(this, this.enemy_bullets);
                if (destroy) {
                    this._removeEnemy(enemy);
                }
            });

            //cleanup
            this.removeBulletsOutOfBounds(this.player_bullets);
            this.removeBulletsOutOfBounds(this.enemy_bullets);

            //finalize
            timer++;
        }

        /*---------------------------------------------------------------------------*/

        pauseGameIfRequested() {
            const {PAUSE: pause_key_active} = this.GLOBAL.KEY_TRACKER.active_keys;

            if (pause_key_active) {
                this.pauseGame();
            }
        }

        /*---------------------------------------------------------------------------*/

        pauseGame() {
            if (!this.GLOBAL.PAUSE_SCENE_LAUNCHED) {
                this.scene.launch(PAUSE_SCENE_KEY, this.GLOBAL);
                this.GLOBAL.PAUSE_SCENE_LAUNCHED = true;
            } else {
                this.scene.wake(PAUSE_SCENE_KEY);
            }
            //halt update + render for main game
            this.scene.pause();
        }

        /*---------------------------------------------------------------------------*/

        createNewEnemies() {
            const ids_to_spawn = enemy_events[timer];
            if (!ids_to_spawn) return;

            enemy_events[timer].forEach(enemy_asset_id => {
                //get unique ID to identify enemy by
                const enemy_id = this.next_enemy_id;
                this.next_enemy_id++;
                //get JSON information on the enemy
                const enemy_base = this.cache.json.get(enemy_asset_id);
                //create the Object to track the enemy and control its sprite
                const enemy = new Enemy(enemy_id, this, enemy_base, this.deadly_enemies);
                //cache the created Object
                this.active_enemies[enemy_id] = enemy;
                if (enemy_base.type === 'boss') {
                    this.active_boss = enemy;
                }
            });
        }

        /*---------------------------------------------------------------------------*/

        _removeEnemy(enemy) {
            enemy.destroySprite();
            delete this.active_enemies[enemy.id];
            if (enemy.type === 'boss') {
                this.active_boss = null;
            }
        }

        /*---------------------------------------------------------------------------*/

        removeBulletsOutOfBounds(bullets) {
            const {width: scene_width, height: scene_height} = this.scale;
            bullets.children.entries.forEach(bullet => {
                const {
                    x: bullet_x,
                    y: bullet_y,
                    width: bullet_width,
                    height: bullet_height,
                } = bullet;
                //overestimate out of bounds criteria (e.g., could be bullet_width / 2)
                if (bullet_x + bullet_width < 0
                    || bullet_x - bullet_width > scene_width
                    || bullet_y + bullet_height < 0
                    || bullet_y - bullet_height > scene_height
                ) {
                    bullet.destroy();
                }
            });
        }
    }

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

    class KeyTracker {
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

    const {
        BOOT_1_SCENE_KEY,
        BOOT_2_SCENE_KEY,
        KEY_TRACKER_KEY,
        PLAYER_JSON_PATH,
        KEY_BINDINGS,
        LEVEL_JSON_PATH,
    } = GLOBALS;

    class BootStep1 extends Phaser.Scene
    {
        constructor() {
            super({ key: BOOT_1_SCENE_KEY });
        }

        /*---------------------------------------------------------------------------*/

        init(global_data) {
            //initialize (changing!) globals to be shared between scenes
            if (Object.keys(global_data).length) {
                this.GLOBAL = global_data;
            } else {
                this.GLOBAL = {
                    //current level
                    LEVEL_ID: "level_1",
                    //currently set key bindings
                    KEY_BINDINGS: KEY_BINDINGS,
                    //tracking of keyboard interactions
                    KEY_TRACKER: new KeyTracker(),
                    //was game paused before
                    PAUSE_SCENE_LAUNCHED: false,
                };
            }
        }

        /*---------------------------------------------------------------------------*/

        preload() {
            const {LEVEL_ID: level_id} = this.GLOBAL;

            //load player information
            this.load.json('player_info', `${PLAYER_JSON_PATH}/kuglis.json`);

            //load level base information (backgrounds)
            this.load.json('level_base_info', `${LEVEL_JSON_PATH}/${level_id}/level_info.json`);
            //load level event timeline
            this.load.json('level_event_info', `${LEVEL_JSON_PATH}/${level_id}/events.json`);
            //load level scripting information
            this.load.json('level_json_keys', `${LEVEL_JSON_PATH}/${level_id}/json_keys.json`);
            //load level asset information (is map)
            this.load.json('level_asset_info', `${LEVEL_JSON_PATH}/${level_id}/asset_map.json`);
        }

        /*---------------------------------------------------------------------------*/

        create() {
            this.scene.launch(KEY_TRACKER_KEY, this.GLOBAL);
            this.scene.start(BOOT_2_SCENE_KEY, this.GLOBAL);
        }
    }

    const {
        BOOT_2_SCENE_KEY: BOOT_2_SCENE_KEY$1,
        FIGHT_SCENE_KEY: FIGHT_SCENE_KEY$1,
        LEVEL_JSON_PATH: LEVEL_JSON_PATH$1,
    } = GLOBALS;

    class BootStep2 extends Phaser.Scene {
        constructor() {
            super({key: BOOT_2_SCENE_KEY$1});
        }

        /*---------------------------------------------------------------------------*/

        init(global_data) {
            this.GLOBAL = global_data;
        }

        /*---------------------------------------------------------------------------*/

        preload() {
            const {LEVEL_ID: level_id} = this.GLOBAL;

            //load the json referenced in the levels json_keys file
            Object.entries(this.cache.json.get('level_json_keys')).forEach(([key, path]) => {
                this.load.json(key, `${LEVEL_JSON_PATH$1}/${level_id}/${path}`);
            });
        }

        /*---------------------------------------------------------------------------*/

        create() {
            this.scene.start(FIGHT_SCENE_KEY$1, this.GLOBAL);
        }
    }

    const {
        FIGHT_SCENE_KEY: FIGHT_SCENE_KEY$2,
        PAUSE_SCENE_KEY: PAUSE_SCENE_KEY$1,
        ASSET_PATH: ASSET_PATH$1,
        MENU_ASSETS_FOLDER,
        PAUSE_INPUT_DEBOUNCE_INITIAL_MS,
        PAUSE_INPUT_DEBOUNCE_QUICK_MS,
        PAUSE_OVERLAY_ALPHA,
        PAUSE_MENU_UPPER_LEFT,
        PAUSE_MENU_Y_OFFSET,
    } = GLOBALS;

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


    class PauseScene extends Phaser.Scene {
        constructor() {
            super({
                key: PAUSE_SCENE_KEY$1,
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
            return `${ASSET_PATH$1}/${MENU_ASSETS_FOLDER}/${suffix}`;
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
            });
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
            this.scene.resume(FIGHT_SCENE_KEY$2);
        }
    }

    const {
        KEY_TRACKER_KEY: KEY_TRACKER_KEY$1
    } = GLOBALS;

    class BackgroundKeyTracking extends Phaser.Scene {
        constructor() {
            super({
                key: KEY_TRACKER_KEY$1,
            });
        }

        /*---------------------------------------------------------------------------*/

        init(global_data) {
            this.GLOBAL = global_data;
        }

        /*---------------------------------------------------------------------------*/

        create() {
            this.cursors = this.input.keyboard.createCursorKeys();

            //bind keys according to key binding specification
            const {UP, DOWN, LEFT, RIGHT, SLOW, FIRE, SPECIAL, PAUSE, ENTER} = this.GLOBAL.KEY_BINDINGS;

            //track player movement
            this.up = this._createPhaserKey(UP);
            this.down = this._createPhaserKey(DOWN);
            this.left = this._createPhaserKey(LEFT);
            this.right = this._createPhaserKey(RIGHT);
            //track player slowdown
            this.slow = this._createPhaserKey(SLOW);
            //track player fire
            this.firing = this._createPhaserKey(FIRE);
            //track player special
            this.special = this._createPhaserKey(SPECIAL);
            //track player accepting prompts etc
            this.enter = this._createPhaserKey(ENTER);

            //scene pausing
            this.pause = this._createPhaserKey(PAUSE);
            this.pause_pressed = false; //track continuous holding of pause key
        }

        /*---------------------------------------------------------------------------*/

        _createPhaserKey({type, key: key_bind}) {
            switch (type) {
                case 'cursor':
                    return this._createPhaserCursorKey(key_bind);
                case 'keyboard':
                    return this._createPhaserKeyboardKey(key_bind);
            }
        }

        /*---------------------------------------------------------------------------*/

        _createPhaserCursorKey(key_bind) {
            return this.cursors[key_bind];
        }

        /*---------------------------------------------------------------------------*/

        _createPhaserKeyboardKey(key_bind) {
            return this.input.keyboard.addKey(
                Phaser.Input.Keyboard.KeyCodes[key_bind]
            );
        }

        /*---------------------------------------------------------------------------*/

        update() {
            //update player movement
            this._setGlobalKey('UP', this.up);
            this._setGlobalKey('DOWN', this.down);
            this._setGlobalKey('LEFT', this.left);
            this._setGlobalKey('RIGHT', this.right);
            //update player slowdown
            this._setGlobalKey('SLOW', this.slow);
            //update player fire
            this._setGlobalKey('FIRE', this.firing);
            //mark that player wants to use his special action
            this._setGlobalKey('SPECIAL', this.special);
            //mark that player wants to proceed through given prompt
            this._setGlobalKey('ENTER', this.enter);

            //mark if game should be paused/unpaused on next scene update step
            this._updatePausePossibility('PAUSE', this.pause);
        }

        /*---------------------------------------------------------------------------*/

        _setGlobalKey(key, phaser_key) {
            const {pressed, active} = this._determineNextKeyState(key, phaser_key);
            this._setKeyTrackerNextKeyState(key, pressed, active);
        }

        /*---------------------------------------------------------------------------*/

        _updatePausePossibility(key, phaser_key) {
            const {pressed, active: key_active_possible} =
                this._determineNextKeyState(key, phaser_key);
            //pause key only counts as active on initial press
            let key_active = false;
            if (key_active_possible) {
                if (!this.pause_pressed) {
                    key_active = true;
                }
                this.pause_pressed = true;
            } else {
                this.pause_pressed = false;
            }
            //set new state
            this._setKeyTrackerNextKeyState(key, pressed, key_active);
        }

        /*---------------------------------------------------------------------------*/

        _determineNextKeyState(key, phaser_key) {
            const pressed = phaser_key.isDown;

            //normally, pressed key is also seen as active
            const res = {
                pressed: pressed,
                active: pressed,
            };
            //blocked keys are not active keys
            const {blocked} = this.GLOBAL.KEY_TRACKER;
            if (blocked[key]) {
                res.active = false;
            }
            return res;
        }

        /*---------------------------------------------------------------------------*/

        _setKeyTrackerNextKeyState(key, pressed, active) {
            const key_tracker = this.GLOBAL.KEY_TRACKER;
            key_tracker.setKeyPressed(key, pressed);
            key_tracker.setKeyActivity(key, active);
        }
    }

    const config = {
        type: Phaser.AUTO,
        width: window.innerWidth,
        height: window.innerHeight,
        physics: {
            default: 'arcade',
            arcade: {
                debug: false
            },
        },
        scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH,
        },
        scene: [
            BootStep1, //load JSON files of level
            BootStep2, //load referenced files from BootStep1
            BackgroundKeyTracking, //to track keyboard input over multiple scenes
            FightScene, //main game scene
            PauseScene, //pause menu
        ],
    };

    //create game and set initial positions
    window.game = new Phaser.Game(config);

})));
