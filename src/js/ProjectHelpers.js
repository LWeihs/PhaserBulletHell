import GLOBALS from "./Globals";

const {
    ASSET_PATH,
} = GLOBALS;

/*---------------------------------------------------------------------------*/

function makeAssetPath(suffix) {
    return `${ASSET_PATH}/${suffix}`;
}

/*---------------------------------------------------------------------------*/

export {
    makeAssetPath,
}