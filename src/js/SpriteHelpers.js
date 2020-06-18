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

/*---------------------------------------------------------------------------*/

export {
    moveSpriteWithinLimits,
    getPositionFromPercentages,
}