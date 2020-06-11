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
    checkSpriteXMovementPossible,
    checkSpriteYMovementPossible,
    getPositionFromPercentages,
}