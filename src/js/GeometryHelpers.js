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

/*---------------------------------------------------------------------------*/

export {
    divideDistXAndY,
    degreeToRadian,
    getRectBorders,
    getRectBordersFromMidpoint,
}