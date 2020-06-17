import {
    FIGHT_SCENE_KEY,
    PAUSE_SCENE_KEY,
} from "../Globals";
import Player from "../Player";
import Enemy from "../Enemy";
import Background from "../Background";
import {makeAssetPath} from "../ProjectHelpers";
import {
    handleHitPlayer,
    handleEnemyHit,
} from "../CollisionHandling";

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
        this.GLOBAL = global_data;

        this.player = new Player(this.cache.json.get('player_info'));

        const level_base_info = this.cache.json.get('level_base_info');
        this.background = new Background(level_base_info.background);

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

        //player setup
        const player_sprite = this.player.create(this);

        //player collision handling
        const player_hit = () => {
            handleHitPlayer(this, this.player);
        };
        this.physics.add.overlap(player_sprite, this.deadly_enemies, player_hit);
        this.physics.add.overlap(player_sprite, this.enemy_bullets, player_hit);

        //enemy collision handling
        this.physics.add.overlap(this.player_bullets, this.deadly_enemies,
            handleEnemyHit);
    }

    /*---------------------------------------------------------------------------*/

    update() {
        //check for game interruptions
        this.pauseGameIfRequested();

        //divide update step into sub-steps of game elements

        //background
        this.background.update();

        //player
        this.player.update(this, this.GLOBAL.KEY_TRACKER.active_keys, this.player_bullets);

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