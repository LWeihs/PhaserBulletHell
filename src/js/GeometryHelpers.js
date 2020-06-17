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

export {
    divideDistXAndY,
    degreeToRadian,
}