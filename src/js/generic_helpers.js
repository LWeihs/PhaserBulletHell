function getEntryModulo(arr, i) {
    return arr[i % arr.length];
}

function makeArrayFromIntervals(start, end, interval) {
    const arr = [];
    let cur = start;
    while (cur <= end) {
        arr.push(cur);
        cur += interval;
    }
    return arr;
}

export {
    getEntryModulo,
    makeArrayFromIntervals,
}