import {
    ASSET_PATH
} from "./Globals";

/*---------------------------------------------------------------------------*/

function makeAssetPath(suffix) {
    return `${ASSET_PATH}/${suffix}`;
}

/*---------------------------------------------------------------------------*/

export {
    makeAssetPath,
}