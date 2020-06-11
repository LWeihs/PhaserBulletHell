import {divideDistXAndY} from "./geometry_helpers";
import {
    getEntryModulo,
    makeArrayFromIntervals,
} from "./generic_helpers";

export default class Routine {
    constructor({name, loops, duration, hp}) {
        this.name = name;
        this.loops = loops;
        this.duration = duration;
        this.has_hp = (hp !== undefined);
        this.max_hp = hp;
        this.cur_hp = hp;

        this.moves = {};
        this.shots = {};
        this.time = 0;

        this.ongoing_movement = {
            x_acceleration: 0,
            y_acceleration: 0,
            x_velo: 0,
            y_velo: 0,
            can_leave: true,
        };
    }

    /*---------------------------------------------------------------------------*/

    applyDamage(dmg) {
        if (this.has_hp) {
            this.cur_hp -= dmg;
        }
    }

    /*---------------------------------------------------------------------------*/

    advanceTimer() {
        this.time++;
        if (this.loops && this.time > this.duration) {
            this.time = 0;
        }
    }

    /*---------------------------------------------------------------------------*/

    isFinished() {
        return (this.time > this.duration) || (this.has_hp && this.cur_hp <= 0);
    }

    /*---------------------------------------------------------------------------*/

    addMovesByDescription(move_desc) {
        switch (move_desc.type) {
            case 'Stop':
                this.addStopMoves(move_desc.times);
                break;
            case 'Randomized':
                this.addMovesFromRandomizedMoves(move_desc);
                break;
            case 'Fixed':
            default:
                this.addMovesFromFixedMoves(move_desc);
                break;
        }
    }

    /*---------------------------------------------------------------------------*/

    addMovesFromFixedMoves(fixed_moves_desc) {
        fixed_moves_desc.can_leave = true;
        const move = this.reduceMoveDescToMove(fixed_moves_desc);
        fixed_moves_desc.times.forEach(time => {
            this.addSingleMove(move, time);
        });
    }

    /*---------------------------------------------------------------------------*/

    addMovesFromRandomizedMoves(rnd_moves_desc) {
        rnd_moves_desc.can_leave = false;
        const move = this.reduceMoveDescToMove(rnd_moves_desc);
        rnd_moves_desc.times.forEach(time => {
            this.addSingleMove(move, time);
        });
    }

    /*---------------------------------------------------------------------------*/

    addStopMoves(times) {
        const stop_move = {
            type: 'Fixed', //for switch in Scenes
            x_acceleration: 0,
            y_acceleration: 0,
            x_velo: 0,
            y_velo: 0,
            can_leave: true, //should be irrelevant
        };
        times.forEach(time => {
            this.addSingleMove(stop_move, time);
        });
    }

    /*---------------------------------------------------------------------------*/

    reduceMoveDescToMove(move_desc) {
        const red_desc = Object.assign({}, move_desc);
        delete red_desc.times;
        return red_desc;
    }

    /*---------------------------------------------------------------------------*/

    //move must have: x_acceleration, y_acceleration, x_velo, y_velo
    addSingleMove(move, time) {
        this.moves[time] = move;
    }

    /*---------------------------------------------------------------------------*/

    getMovesCurrentTime() {
        const new_move_info = this.moves[this.time];
        if (new_move_info) {
            switch (new_move_info.type) {
                case 'Fixed':
                    this.setOngoingMovement(new_move_info);
                    break;
                case 'Randomized':
                    this.setOngoingMovementFromRandom(new_move_info);
            }
        }
        return this.ongoing_movement;
    }

    /*---------------------------------------------------------------------------*/

    setOngoingMovementFromRandom(move_info) {
        //determine x_velo and y_velo to be used at this time
        const {x_velo_range, y_velo_range} = move_info;
        move_info.x_velo = Phaser.Math.Between(x_velo_range[0], x_velo_range[1]);
        move_info.y_velo = Phaser.Math.Between(y_velo_range[0], y_velo_range[1]);
        //transfer info to tracked ongoing movement
        this.setOngoingMovement(move_info);
    }

    /*---------------------------------------------------------------------------*/

    setOngoingMovement(move_info) {
        //reduce given info to properties shown to outside
        this.ongoing_movement = {
            x_acceleration: move_info.x_acceleration,
            y_acceleration: move_info.y_acceleration,
            x_velo: move_info.x_velo,
            y_velo: move_info.y_velo,
            can_leave: move_info.can_leave,
        };
    }

    /*---------------------------------------------------------------------------*/

    disableOngoingXMovement() {
        this.ongoing_movement.x_acceleration = 0;
        this.ongoing_movement.x_velo = 0;
    }

    /*---------------------------------------------------------------------------*/

    disableOngoingYMovement() {
        this.ongoing_movement.y_acceleration = 0;
        this.ongoing_movement.y_velo = 0;
    }

    /*---------------------------------------------------------------------------*/

    addShotsByDescription(shot_desc) {
        switch(shot_desc.type) {
            case 'ShotArray':
                this.addShotsFromShotArray(shot_desc);
                break;
            case 'ShotRow':
                this.addShotsFromShotRow(shot_desc);
                break;
            case 'ShotCircle':
                this.addShotsFromShotCircle(shot_desc);
                break;
            case 'ShotTwister':
                this.addShotsFromShotTwister(shot_desc);
                break;
        }
    }

    /*---------------------------------------------------------------------------*/

    addShotsFromShotArray(shot_arr_desc) {
        const {times, shots, anchor} = shot_arr_desc;
        shots.forEach(shot => {
            times.forEach(time => {
                this.addSingleShot(shot, time, anchor);
            });
        });
    }

    /*---------------------------------------------------------------------------*/

    addShotsFromShotRow(shot_row_desc) {
        let {nr_shots, //dictates the shot density
            anchor, //where to anchor the full row on the enemy asset
            shot_ids, //the asset ids of individual shots
            speeds, //the speeds of individual shots
            degrees, //the degrees of individual shots
            x_offset_start, //placed along line from this x
            x_offset_end, //placed along line to this x
            y_offset, //offset in y-direction
            continuous, //if shots are to be repeated
            times, //cont = false => individual shot appearance times
            interval, //cont = true => interval in which shots appear
            start_time, //cont = true => time at which to start interval
        } = shot_row_desc;

        //find out at which times individual shots spawn
        if (continuous) {
            times = makeArrayFromIntervals(start_time, this.duration, interval);
        }
        //find out x-distance between shots
        const x_dist = x_offset_end - x_offset_start;
        const x_interval = x_dist / nr_shots;

        //create individual shots
        for (let i=0; i<nr_shots; ++i) {
            const shot = {
                shot_id: getEntryModulo(shot_ids, i),
                speed: getEntryModulo(speeds, i),
                degree: getEntryModulo(degrees, i),
                x_offset: x_offset_start + x_interval * i,
                y_offset: y_offset
            };
            times.forEach(time => {
                this.addSingleShot(shot, time, anchor);
            });
        }
    }

    /*---------------------------------------------------------------------------*/

    addShotsFromShotCircle(shot_circle_desc) {
        let {nr_shots, //dictates the shot density
            anchor, //where to anchor the full row on the enemy asset
            shot_ids, //the asset ids of individual shots
            speeds, //the speeds of individual shots
            shot_spread, //whether shot's movement should follow their spawn degree
            degrees, //shot_spread = false => the degrees of individual shots
            x_offset, //offset in x-direction
            y_offset, //offset in y-direction
            continuous, //if shots are to be repeated
            times, //cont = false => individual shot appearance times
            interval, //cont = true => interval in which shots appear
            start_time, //cont = true => time at which to start interval
            start_degree, //at which degree (of circle) to place first shot
            end_degree, //at which degree (of circle) to place last shot
            radius, //distance from middle of circle to individual shots
        } = shot_circle_desc;

        //find out at which times individual shots spawn
        if (continuous) {
            times = makeArrayFromIntervals(start_time, this.duration, interval);
        }
        //find out degree interval between shots
        start_degree = (start_degree !== undefined) ? start_degree : 0;
        end_degree = (end_degree !== undefined) ? end_degree : 360;
        const degree_diff = end_degree - start_degree;
        const degree_interval = degree_diff / nr_shots;

        //create individual shots
        for (let i=0; i<nr_shots; ++i) {
            //determine where shot spawns
            const spawn_degree = start_degree + degree_interval*i;
            const {x: x_offset_circle, y: y_offset_circle} =
                divideDistXAndY(radius, spawn_degree, false);
            //determine shot movement
            const shot_degree = shot_spread
                ? spawn_degree
                : getEntryModulo(degrees, i);
            //build the shot
            const shot = {
                shot_id: getEntryModulo(shot_ids, i),
                speed: getEntryModulo(speeds, i),
                degree: shot_degree,
                x_offset: x_offset + x_offset_circle,
                y_offset: y_offset + y_offset_circle,
            };
            //add shot at expected times
            times.forEach(time => {
                this.addSingleShot(shot, time, anchor);
            });
        }
    }

    /*---------------------------------------------------------------------------*/

    addShotsFromShotTwister(shot_twister_desc) {
        let {
            anchor,
            x_offset,
            y_offset,
            speeds,
            start_degree,
            finish_degree,
            direction,
            degree_offset,
            shot_ids,
            start_time,
            time_interval,
            radius,
            continuous,
            repeat_interval
        } = shot_twister_desc;

        //infer number of shots to create
        const degree_diff = finish_degree - start_degree;
        const nr_shots = Math.floor(degree_diff/degree_offset);
        if (nr_shots <= 0) {
            return;
        }

        //infer full time of twister (until all shots are dealt with)
        const full_time = (nr_shots-1) * time_interval;

        //infer direction multiplier
        const dir_multiplier = (direction === 'clockwise') ? 1 : -1;

        //set degree and time of first twister shot
        let cur_degree = start_degree;
        let cur_time = start_time;

        //create individual shots
        for (let i=0; i<nr_shots; ++i) {
            //determine where shot spawns
            const {x: x_offset_circle, y: y_offset_circle} =
                divideDistXAndY(radius, cur_degree, false);
            //build the shot
            const shot = {
                shot_id: getEntryModulo(shot_ids, i),
                speed: getEntryModulo(speeds, i),
                degree: cur_degree,
                x_offset: x_offset + x_offset_circle,
                y_offset: y_offset + y_offset_circle,
            };
            //find times when shot should be created
            let times = [];
            if (continuous) {
                let next_time = cur_time;
                while (next_time < this.duration) {
                    times.push(next_time);
                    next_time += (full_time + repeat_interval);
                }
            } else {
                times.push(cur_time);
            }

            //add shots at expected times
            times.forEach(time =>  {
                this.addSingleShot(shot, time, anchor);
            });


            //update next position and next shot spawn time
            cur_degree += dir_multiplier * degree_offset;
            cur_time += time_interval;
        }
    }

    /*---------------------------------------------------------------------------*/

    addSingleShot({shot_id, speed, degree, x_offset, y_offset}, time, anchor) {
        //translate given speed and degree into usable velocities
        const {x: x_velo, y: y_velo} = divideDistXAndY(speed, degree, false);
        //make shot entry
        if (!this.shots.hasOwnProperty(time)) {
            this.shots[time] = [];
        }
        this.shots[time].push({
            shot_id: shot_id,
            x_offset: x_offset,
            y_offset: y_offset,
            anchor: anchor,
            x_velo: x_velo,
            y_velo: y_velo,
        });
    }

    /*---------------------------------------------------------------------------*/

    getShotsCurrentTime() {
        //undefined or shots
        return this.shots[this.time];
    }
}