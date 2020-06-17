import Routine from "./Routine";

function createRoutine(info) {
    const routine = new Routine(info);
    info.moves && info.moves.forEach(move_desc => {
        routine.addMovesByDescription(move_desc);
    });
    info.shots && info.shots.forEach(shot_desc => {
        routine.addShotsByDescription(shot_desc);
    });
    return routine;
}

/*---------------------------------------------------------------------------*/

export {
    createRoutine,
}