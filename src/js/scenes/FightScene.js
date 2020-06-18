import GLOBALS from "../Globals";
import GameState from "../GameState";
import UI from "../UI/UI";
import Player from "../Player";
import Enemy from "../Enemy";
import Background from "../Background";
import {
    makeAssetPath,
} from "../ProjectHelpers";
import {
    handleHitPlayer,
    handleEnemyHit,
} from "../CollisionHandling";
import handlePlayerSpecial from "../Specials";
import {
    getRectBorders,
} from "../GeometryHelpers";

const {
    FIGHT_SCENE_KEY,
    PAUSE_SCENE_KEY,
    ENERGY_ACCUMULATION_INTERVAL,
    ENERGY_PASSIVE_ACCUMULATION,
} = GLOBALS;

//level progression
let timer = 0;
const enemy_events = {};

export default class FightScene extends Phaser.Scene {
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
        this.active_enemies = [];
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
        //groups for enemies and bullets
        this.player_bullets = this.physics.add.group();
        this.enemy_bullets = this.physics.add.group();
        this.deadly_enemies = this.physics.add.group();

        //background
        this.background.create(this);

        //UI
        this.UI.syncWithGameState(this.game_state);

        //player setup
        const player_sprite = this.player.create(this);

        //player collision handling
        const player_hit = () => {
            handleHitPlayer(this, this.player, this.game_state);
        };
        this.physics.add.overlap(player_sprite, this.deadly_enemies, player_hit);
        this.physics.add.overlap(player_sprite, this.enemy_bullets, player_hit);

        //enemy collision handling
        this.physics.add.overlap(this.player_bullets, this.deadly_enemies,
            handleEnemyHit);

        //start repeating timers
        this._startRepeatingTimer(ENERGY_ACCUMULATION_INTERVAL, () => {
            this.game_state.addEnergy(ENERGY_PASSIVE_ACCUMULATION);
        });
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
        this.UI.syncWithGameState(this.game_state);

        //player
        this.player.update(this, active_keys, this.player_bullets);
        handlePlayerSpecial(active_keys, this.game_state, this.limits, this.player);

        //enemies by timeline
        this.createNewEnemies();
        this.active_enemies.forEach(enemy => {
            enemy.update(this, this.enemy_bullets);
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

        enemy_events[timer].forEach(enemy_id => {
            const enemy_base = this.cache.json.get(enemy_id);
            //create the Object to track the enemy and control its sprite
            const enemy = new Enemy(this, enemy_base, this.deadly_enemies);
            this.active_enemies.push(enemy);
        });
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