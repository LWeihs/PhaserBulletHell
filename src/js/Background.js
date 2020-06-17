import {BACKGROUND_ALPHA} from "./Globals";
import {makeAssetPath} from "./ProjectHelpers";

/**
 * Based on level info JSON.
 */
export default class Background {
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