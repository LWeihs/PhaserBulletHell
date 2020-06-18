import {getRectBordersFromMidpoint} from "../GeometryHelpers";

export default class PercentageBar {
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