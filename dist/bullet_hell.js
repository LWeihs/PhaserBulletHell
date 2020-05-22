(function (factory) {
    typeof define === 'function' && define.amd ? define(factory) :
    factory();
}((function () { 'use strict';

    /** SCENE KEYS **/

    const BOOT_1_SCENE_KEY = 'boot1';
    const BOOT_2_SCENE_KEY = 'boot2';
    const FIGHT_SCENE_KEY = 'fight';
    const PAUSE_SCENE_KEY = 'pause';
    const KEY_TRACKER_KEY = 'key_tracker';

    /** KEY BINDINGS **/

    const KEY_BINDINGS = {
        //player movement
        UP: {type: 'cursor', key: 'up'},
        DOWN: {type: 'cursor', key: 'down'},
        LEFT: {type: 'cursor', key: 'left'},
        RIGHT: {type: 'cursor', key: 'right'},
        SLOW: {type: 'cursor', key: 'shift'},
        FIRE: {type: 'keyboard', key: 'Y'},
        //general
        PAUSE: {type: 'keyboard', key: 'ESC'},
    };

    /** BACKGROUNDS **/

    const BACKGROUND_ALPHA = 0.5;
    const DEFAULT_SCROLL_SPEED = 2;

    /** POSITIONING **/

    const PLAYER_OFFSETS = {
        x: 1/2,
        y: 9/10,
    };
    const BOSS_OFFSETS = {
        x: 1/2,
        y: 1/10,
    };
    const BOSS_LIMITS = {
        x_min: 0,
        x_max: 1,
        y_min: 0,
        y_max: 1/3,
    };

    /** FOLDER STRUCTURE **/

    const ASSET_PATH = 'assets';
    const PLAYER_JSON_PATH = 'player';
    const LEVEL_JSON_PATH = 'levels';

    /** PLAYER INFORMATION (SAME BETWEEN ALL PLAYERS) **/

    const INVIS_FRAMES_AFTER_HIT = 60;

    class Enemy {
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
            }
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
                times.forEach(time => {
                    this.addSingleShot(shot, time, anchor);
                });
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

    function checkSpriteXMovementPossible(sprite, {x_min, x_max}) {
        const res = {
            possible: true,
            rem: undefined, //remaining available move space
        };
        const dx = getSpriteDxPerFrame(sprite);
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

    function checkSpriteYMovementPossible(sprite, {y_min, y_max}) {
        const res = {
            possible: true,
            rem: undefined, //remaining available move space
        };
        const dy = getSpriteDyPerFrame(sprite);
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

    //globals filled during execution
    let player;
    let player_bullets;
    let enemy_bullets;
    let deadly_enemies;
    //player
    let recharge = 0, cooldown = 0;
    //level progression
    let timer = 0;
    const enemy_events = {};
    //copy
    const enemy_infos = [];
    const enemies_by_id = {};
    //tracking info regarding the player
    let remaining_invis_frames = 0;

    class FightScene extends Phaser.Scene {
        constructor() {
            super({
                key: FIGHT_SCENE_KEY,
            });
        }

        /*---------------------------------------------------------------------------*/

        init(global_data) {
            this.GLOBAL = global_data;
        }

        /*---------------------------------------------------------------------------*/

        preload () {
            this.preloadLevelAssets();
            this.setUpEventTimeline();

            const {asset_folder, weapon} = this.cache.json.get('player_info');
            cooldown = weapon.fire_rate;

            this.load.image('player_sprite', this.makeAssetPath(`${asset_folder}/sprite.png`));
            this.load.image('player_bullet', this.makeAssetPath(`${asset_folder}/bullet.png`));
            //background
            this.load.image('background_shapes', this.makeAssetPath('level 1/parallax_1.png'));
        }

        /*---------------------------------------------------------------------------*/

        makeAssetPath(suffix) {
            return `${ASSET_PATH}/${suffix}`;
        }

        /*---------------------------------------------------------------------------*/

        preloadLevelAssets() {
            Object.entries(this.cache.json.get('level_asset_info'))
                .forEach(([key, file_path]) => {
                this.load.image(key, this.makeAssetPath(file_path));
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
            const {width: scene_width, height: scene_height} = this.scale;
            this.setUpBackground(scene_width, scene_height);

            //groups for enemies and bullets
            player_bullets = this.physics.add.group();
            enemy_bullets = this.physics.add.group();
            deadly_enemies = this.physics.add.group();

            //player setup
            player = this.physics.add.image(scene_width * PLAYER_OFFSETS.x,
                scene_height * PLAYER_OFFSETS.y,
                'player_sprite'
            );
            player.setCollideWorldBounds(true);
            player.setDepth(1);

            //setup collision detection of the distinct physics groups
            this.physics.add.overlap(player, deadly_enemies, this.handlePlayerHit, null, this);
            this.physics.add.overlap(player, enemy_bullets, this.handlePlayerHit, null, this);
        }

        /*---------------------------------------------------------------------------*/

        setUpBackground(scene_width, scene_height) {
            const bg = this.textures.get('background_shapes');
            const {width: bg_width} = bg.frames.__BASE;
            this.firstParallax = this.add.tileSprite(bg_width / 2,
                scene_height / 2,
                bg_width,
                scene_height,
                'background_shapes'
            );
            this.firstParallax.setAlpha(BACKGROUND_ALPHA);
        }

        /*---------------------------------------------------------------------------*/

        handlePlayerHit() {
            //check if player is protected
            if (remaining_invis_frames) {
                remaining_invis_frames--;
                return;
            }
            //if not, handle player hit


            //set up invis frames after hit
            remaining_invis_frames = INVIS_FRAMES_AFTER_HIT;
        }

        /*---------------------------------------------------------------------------*/

        update() {
            //check for game interruptions
            this.pauseGameIfRequested();

            //cosmetic
            this.updateBackground();

            //move all objects to new positions
            //player
            this.playerMove();
            this.playerFire();
            //enemies
            this.createNewEnemies();
            this.updateEnemies();

            //cleanup
            this.removeBulletsOutOfBounds(player_bullets);
            this.removeBulletsOutOfBounds(enemy_bullets);

            //finalize
            timer++;
        }

        /*---------------------------------------------------------------------------*/

        pauseGameIfRequested() {
            const {PAUSE: pause_key_down} = this.GLOBAL.KEYS;

            if (pause_key_down) {
                this.pauseGame();
            }
        }

        /*---------------------------------------------------------------------------*/

        pauseGame() {
            this.scene.launch(PAUSE_SCENE_KEY, this.GLOBAL);
            this.scene.pause();
        }

        /*---------------------------------------------------------------------------*/

        updateBackground() {
            this.firstParallax.tilePositionY -= DEFAULT_SCROLL_SPEED;
        }

        /*---------------------------------------------------------------------------*/

        playerMove() {
            //get information on which keys are pressed from shared globals
            const {
                UP: up_pressed,
                DOWN: down_pressed,
                LEFT: left_pressed,
                RIGHT: right_pressed,
                SLOW: slow_pressed,
            } = this.GLOBAL.KEYS;

            //determine player speed
            const {movement} = this.cache.json.get('player_info');
            const speed = slow_pressed ? movement.slowed : movement.normal;

            //set velocity based on speed and pressed movement keys
            let x_velo = 0, y_velo = 0;
            if (up_pressed) {
                y_velo -= speed;
            }
            if (down_pressed) {
                y_velo += speed;
            }
            if (left_pressed) {
                x_velo -= speed;
            }
            if (right_pressed) {
                x_velo += speed;
            }
            player.setVelocityX(x_velo);
            player.setVelocityY(y_velo);
        }

        /*---------------------------------------------------------------------------*/

        playerFire() {
            const {FIRE: fire_btn_pressed} = this.GLOBAL.KEYS;
            const {weapon} = this.cache.json.get('player_info');
            if (fire_btn_pressed) {
                //if weapon is ready, create new player bullet
                if (recharge === 0) {
                    const bullet = player_bullets.create(player.x, player.y - player.height,
                        'player_bullet');
                    bullet.setVelocityY(-weapon.bullet_speed);
                    recharge = cooldown;
                } else {
                    recharge--;
                }
            }
        }

        /*---------------------------------------------------------------------------*/

        createNewEnemies() {
            const ids_to_spawn = enemy_events[timer];
            if (!ids_to_spawn) return;

            enemy_events[timer].forEach(enemy_id => {
                //create enemy sprite
                const enemy_sprite = this.createEnemySprite(enemy_id);
                //track the sprite
                deadly_enemies.add(enemy_sprite);
                enemies_by_id[enemy_id] = enemy_sprite;

                //create information Object for the enemy
                const enemy_info = this.createEnemyInfo(enemy_id, enemy_sprite);
                //track the information
                enemy_infos.push(enemy_info);
            });
        }

        /*---------------------------------------------------------------------------*/

        createEnemySprite(enemy_id) {
            const {width: scene_width, height: scene_height} = this.scale;

            //create sprite at position defined by offsets in globals
            const enemy = this.physics.add.image(scene_width * BOSS_OFFSETS.x,
                scene_height * BOSS_OFFSETS.y,
                enemy_id,
            );
            enemy.setDepth(1);

            return enemy;
        }

        /*---------------------------------------------------------------------------*/

        createEnemyInfo(enemy_id, enemy_sprite) {
            const {width: scene_width, height: scene_height} = this.scale;

            //get the enemies blueprint as noted in JSON file
            const enemy_base = this.cache.json.get(enemy_id);
            //create the Object to hold enemy information
            const enemy_info = new Enemy(enemy_id, enemy_sprite, enemy_base.type,
                scene_width, scene_height);
            //add information on the used Routines
            enemy_base.routines.forEach(({name: routine_name}) => {
                enemy_info.addRoutine(createRoutine(this.cache.json.get(routine_name)));
            });

            return enemy_info;
        }

        /*---------------------------------------------------------------------------*/

        updateEnemies() {
            enemy_infos.forEach(enemy_info => {
                const enemy = enemies_by_id[enemy_info.id];

                //update enemy itself
                this.updateEnemyMovement(enemy, enemy_info);

                //handle enemy shooting as dictated by its routine
                const shot_infos = enemy_info.getNextShots();
                shot_infos && shot_infos.forEach(shot_info => {
                    this.createNewEnemyShot(shot_info, enemy);
                });

                //move routine to next step
                enemy_info.updateCurrentRoutine();
            });
        }

        /*---------------------------------------------------------------------------*/

        updateEnemyMovement(enemy, enemy_info) {
            const move_info = enemy_info.getNextMoves();
            let {x_acceleration, y_acceleration, x_velo, y_velo, can_leave} = move_info;

            //ensure that random movements do stay within enemy's limits
            if (!can_leave) {
                const limits = enemy_info.getLimits();
                //control x-movement
                const {possible: x_move_possible, rem: x_rem} =
                    checkSpriteXMovementPossible(enemy, limits);
                if (!x_move_possible) {
                    enemy_info.disableOngoingXMovement();
                    enemy.x += x_rem;
                    x_velo = 0;
                }
                //control y-movement
                const {possible: y_move_possible, rem: y_rem} =
                    checkSpriteYMovementPossible(enemy, limits);
                if (!y_move_possible) {
                    enemy_info.disableOngoingYMovement();
                    enemy.y += y_rem;
                    y_velo = 0;
                }
            }

            //set new movement
            enemy.setVelocityX(x_velo);
            enemy.setVelocityY(y_velo);
            enemy.setAccelerationX(x_acceleration);
            enemy.setAccelerationY(y_acceleration);
        }

        /*---------------------------------------------------------------------------*/

        createNewEnemyShot(shot_info, {x: enemy_x, y: enemy_y, width: enemy_width,
            height: enemy_height}) {
            //create the shot in the game world
            const {shot_id, x_offset, y_offset} = shot_info;
            let shot_x = enemy_x + x_offset;
            let shot_y = enemy_y + y_offset;
            switch (shot_info.anchor) {
                case 'Top':
                    shot_y -= enemy_height/2;
                    break;
                case 'Bottom':
                    shot_y += enemy_height/2;
                    break;
                case 'Left':
                    shot_x -= enemy_width/2;
                    break;
                case 'Right':
                    shot_x += enemy_width/2;
                    break;
            }
            const shot = this.physics.add.image(shot_x, shot_y, shot_id);

            //track shot for collision detection with player
            enemy_bullets.add(shot);

            //apply physics properties to the shot
            const {x_velo, y_velo} = shot_info;
            shot.setVelocityX(x_velo);
            shot.setVelocityY(y_velo);
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
                    //track which keys are currently hit
                    KEYS: {
                        //player movement
                        UP: false,
                        DOWN: false,
                        LEFT: false,
                        RIGHT: false,
                        //player slow down
                        SLOW: false,
                    }
                };
            }
        }

        /*---------------------------------------------------------------------------*/

        preload() {
            const {LEVEL_ID: level_id} = this.GLOBAL;

            //load player information
            this.load.json('player_info', `${PLAYER_JSON_PATH}/kuglis.json`);
            //load level event timeline
            this.load.json('level_event_info', `${LEVEL_JSON_PATH}/${level_id}/events.json`);
            //load level scripting information
            this.load.json('level_json_keys', `${LEVEL_JSON_PATH}/${level_id}/json_keys.json`);
            //load level asset information
            this.load.json('level_asset_info', `${LEVEL_JSON_PATH}/${level_id}/asset_map.json`);
        }

        /*---------------------------------------------------------------------------*/

        create() {
            this.scene.launch(KEY_TRACKER_KEY, this.GLOBAL);
            this.scene.start(BOOT_2_SCENE_KEY, this.GLOBAL);
        }
    }

    class BootStep2 extends Phaser.Scene {
        constructor() {
            super({key: BOOT_2_SCENE_KEY});
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
                this.load.json(key, `${LEVEL_JSON_PATH}/${level_id}/${path}`);
            });
        }

        /*---------------------------------------------------------------------------*/

        create() {
            this.scene.start(FIGHT_SCENE_KEY, this.GLOBAL);
        }
    }

    class PauseScene extends Phaser.Scene {
        constructor() {
            super({
                key: PAUSE_SCENE_KEY,
            });
        }

        /*---------------------------------------------------------------------------*/

        init(global_data) {
            this.GLOBAL = global_data;
        }

        /*---------------------------------------------------------------------------*/

        update() {
            const {PAUSE: pause_key_down} = this.GLOBAL.KEYS;

            if (pause_key_down) {
                this.scene.stop;
                this.scene.resume(FIGHT_SCENE_KEY);
            }
        }
    }

    class KeyTracker extends Phaser.Scene {
        constructor() {
            super({
                key: KEY_TRACKER_KEY,
            });
        }

        /*---------------------------------------------------------------------------*/

        init(global_data) {
            this.GLOBAL = global_data;
        }

        /*---------------------------------------------------------------------------*/

        create() {
            this.cursors = this.input.keyboard.createCursorKeys();

            const {UP, DOWN, LEFT, RIGHT, SLOW, FIRE, PAUSE} = this.GLOBAL.KEY_BINDINGS;

            //track player movement
            this.up = this.createPhaserKey(UP);
            this.down = this.createPhaserKey(DOWN);
            this.left = this.createPhaserKey(LEFT);
            this.right = this.createPhaserKey(RIGHT);
            //track player slowdown
            this.slow = this.createPhaserKey(SLOW);
            //track player fire
            this.firing = this.createPhaserKey(FIRE);

            //scene pausing
            this.pause = this.createPhaserKey(PAUSE);
            this.pause_pressed = false; //track continuous holding of pause key
        }

        /*---------------------------------------------------------------------------*/

        createPhaserKey({type, key: key_bind}) {
            switch (type) {
                case 'cursor':
                    return this.createPhaserCursorKey(key_bind);
                case 'keyboard':
                    return this.createPhaserKeyboardKey(key_bind);
            }
        }

        /*---------------------------------------------------------------------------*/

        createPhaserCursorKey(key_bind) {
            return this.cursors[key_bind];
        }

        /*---------------------------------------------------------------------------*/

        createPhaserKeyboardKey(key_bind) {
            return this.input.keyboard.addKey(
                Phaser.Input.Keyboard.KeyCodes[key_bind]
            );
        }

        /*---------------------------------------------------------------------------*/

        update() {
            //update player movement
            this.setGlobalKey('UP', this.up);
            this.setGlobalKey('DOWN', this.down);
            this.setGlobalKey('LEFT', this.left);
            this.setGlobalKey('RIGHT', this.right);
            //update player slowdown
            this.setGlobalKey('SLOW', this.slow);
            //update player fire
            this.setGlobalKey('FIRE', this.firing);

            //mark if game should be paused/unpaused on next scene update step
            this.updatePausePossibility('PAUSE', this.pause);
        }

        /*---------------------------------------------------------------------------*/

        setGlobalKey(key, phaser_key) {
            const keys = this.GLOBAL.KEYS;
            if (phaser_key.isDown) {
                keys[key] = true;
            } else if (phaser_key.isUp) {
                keys[key] = false;
            }
        }

        /*---------------------------------------------------------------------------*/

        updatePausePossibility(key, phaser_key) {
            const keys = this.GLOBAL.KEYS;

            //find out whether global key should be activated
            let activate = false;
            if (phaser_key.isDown) {
                if (!this.pause_pressed) {
                    activate = true;
                }
                this.pause_pressed = true;
            } else if (phaser_key.isUp) {
                this.pause_pressed = false;
            }

            //set global key to new activation status
            keys[key] = activate;
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
            BootStep1, //load json files of level
            BootStep2, //load referenced files from BootStep1
            KeyTracker, //to track keyboard input over multiple scenes
            FightScene, //main game scene
            PauseScene, //pause menu
        ],
    };

    //create game and set initial positions
    window.game = new Phaser.Game(config);

})));
