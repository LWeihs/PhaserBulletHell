import {
    ASSET_PATH
} from "./globals";

/*---------------------------------------------------------------------------*/

function makeAssetPath(suffix) {
    return `${ASSET_PATH}/${suffix}`;
}

/*---------------------------------------------------------------------------*/

export {
    makeAssetPath,
}