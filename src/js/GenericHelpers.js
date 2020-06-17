function getEntryModulo(arr, i) {
    return arr[i % arr.length];
}

/*---------------------------------------------------------------------------*/

function makeArrayFromIntervals(start, end, interval) {
    const arr = [];
    let cur = start;
    while (cur <= end) {
        arr.push(cur);
        cur += interval;
    }
    return arr;
}

/*---------------------------------------------------------------------------*/

function roundTo2Dp(num) {
    return Math.round((num + 0.00001) * 100) / 100
}

/*---------------------------------------------------------------------------*/

export {
    getEntryModulo,
    makeArrayFromIntervals,
    roundTo2Dp,
}