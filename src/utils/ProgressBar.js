import {stdout as slog} from "single-line-log";

module.exports = function ProgressBar(description, bar_length) {
    this.description = description || 'Progress';
    this.length = bar_length || 25;
    this.lastcell = -1;
    this.render = function (opts) {
        const cell_num = Math.floor(opts.percent * this.length);
        if(this.lastcell === cell_num) return;
        this.lastcell = cell_num;
        let cell = '';
        for (let i = 0; i < cell_num; i++) {

            cell += '█';

        }
        let empty = '';
        for (let i = 0; i < this.length - cell_num; i++) {

            empty += '░';

        }
        const cmdText = this.description + ' ' + (100 * opts.percent).toFixed(2) + '% ' + cell + empty + ' ' + opts.completed + '/' + opts.total;
        slog(cmdText);
    };
};
