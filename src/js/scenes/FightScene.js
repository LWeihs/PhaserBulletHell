import {
    FIGHT_SCENE_KEY,
    PAUSE_SCENE_KEY,
    BOSS_OFFSETS,
    BACKGROUND_ALPHA,
    DEFAULT_SCROLL_SPEED,
    INVIS_FRAMES_AFTER_HIT,
} from "../globals";
import Player from "../Player";
import Enemy from "../enemy";
import Background from "../Background";
import {
    createRoutine,
} from "../jsonToObjects";
import {
    checkSpriteXMovementPossible,
    checkSpriteYMovementPossible,
    getPositionFromPercentages,
} from "../SpriteHelpers";
import {makeAssetPath} from "../ProjectHelpers";

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
//info on currently present enemies
const active_enemies = [];
const enemies_by_id = {};
//tracking info regarding the player
let remaining_invis_frames = 0;

export default class FightScene extends Phaser.Scene {
    constructor() {
        super({
            key: FIGHT_SCENE_KEY,
        });
    }

    /*---------------------------------------------------------------------------*/

    init(global_data) {
        this.GLOBAL = global_data;

        this.player = new Player(this.cache.json.get('player_info'));

        const level_base_info = this.cache.json.get('level_base_info');
        this.background = new Background(level_base_info.background);
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

        //groups for enemies and bullets
        player_bullets = this.physics.add.group();
        enemy_bullets = this.physics.add.group();
        deadly_enemies = this.physics.add.group();

        //player setup
        const player_sprite = this.player.create(this);

        //setup collision detection of the distinct physics groups
        this.physics.add.overlap(player_sprite, deadly_enemies, this.handlePlayerHit, null, this);
        this.physics.add.overlap(player_sprite, enemy_bullets, this.handlePlayerHit, null, this);
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
        this.background.update();

        //move all objects to new positions
        //player
        const {shots} = this.player.update(this, this.GLOBAL.KEY_TRACKER.active_keys);
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
        //create sprite at position defined by offsets in globals
        const {x: enemy_x, y: enemy_y} = getPositionFromPercentages(BOSS_OFFSETS, this.scale);
        const enemy = this.physics.add.image(enemy_x, enemy_y, enemy_id);
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

            //handle routine transitions
            if (enemy_info.isCurrentRoutineFinished()) {
                if (enemy_info.existNextRoutine()) {
                    enemy_info.advanceRoutine();
                } else {
                    //TODO: enemy is done here
                }
            }

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
            case 'Middle':
            default:
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