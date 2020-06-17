import {divideDistXAndY} from "./geometry_helpers";

function createMultipleShotSprites(game, shot_infos, reference) {
    const shot_sprites = [];
    shot_infos.forEach(shot_info => {
        shot_sprites.push(createShotSprite(game, shot_info, reference));
    });
    return shot_sprites;
}

/*---------------------------------------------------------------------------*/

function createShotSprite(game, shot_info, reference) {
    let {
        shot_id, //ID of the shot image (in game's cache)
        x_offset, //x-offset from reference
        y_offset, //y-offset from reference
        anchor, //side (or middle) of reference to anchor shot to

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
        case 'Middle':
        default:
            break;
    }

    //create the shot as physical image in the game world at placement
    const shot = game.physics.add.image(shot_x, shot_y, shot_id);

    //find values to use for x- and y-velocity of shot
    if (!x_velo) {
        //ALTERNATIVE 2
        ({x: x_velo, y: y_velo} = divideDistXAndY(speed, degree, false));
    }
    shot.setVelocityX(x_velo);
    shot.setVelocityY(y_velo);

    //return the created physics object
    return shot;
}

/*---------------------------------------------------------------------------*/

export {
    createMultipleShotSprites,
    createShotSprite,
}