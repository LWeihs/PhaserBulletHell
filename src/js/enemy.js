export default class Enemy {
    constructor(id) {
        this.id = id;
        this.routines = [];
        this.cur_routine = 0;
    }

    /*---------------------------------------------------------------------------*/

    addRoutine(routine) {
        this.routines.push(routine);
    }

    /*---------------------------------------------------------------------------*/

    existNextRoutine() {
        return this.cur_routine < this.routines.length-1;
    }

    /*---------------------------------------------------------------------------*/

    advanceRoutine() {
        this.cur_routine++;
    }

    /*---------------------------------------------------------------------------*/

    getCurrentRoutine() {
        return this.routines[this.cur_routine];
    }

    /*---------------------------------------------------------------------------*/

    getNextMoves() {
        //always returns an Object!
        return this.getCurrentRoutine().getMovesCurrentTime();
    }

    /*---------------------------------------------------------------------------*/

    getNextShots() {
        //returns an Array or undefined!
        return this.getCurrentRoutine().getShotsCurrentTime();
    }

    /*---------------------------------------------------------------------------*/

    applyDamage(dmg) {
        this.getCurrentRoutine().applyDamage(dmg);
    }

    /*---------------------------------------------------------------------------*/

    updateCurrentRoutine() {
        this.getCurrentRoutine().advanceTimer();
    }
}