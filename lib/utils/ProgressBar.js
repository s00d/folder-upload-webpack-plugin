"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var single_line_log_1 = require("single-line-log");
var Progress = /** @class */ (function () {
    function Progress(description, bar_length) {
        this.description = description || 'Progress';
        this.length = bar_length || 25;
        this.lastCell = -1;
    }
    Progress.prototype.render = function (opts) {
        var cell_num = Math.floor(opts.percent * this.length);
        if (this.lastCell === cell_num)
            return;
        this.lastCell = cell_num;
        var cell = '';
        for (var i = 0; i < cell_num; i++) {
            cell += '█';
        }
        var empty = '';
        for (var i = 0; i < this.length - cell_num; i++) {
            empty += '░';
        }
        var cmdText = this.description + ' ' + (100 * opts.percent).toFixed(2) + '% ' + cell + empty + ' ' + opts.completed + '/' + opts.total;
        single_line_log_1.stdout(cmdText);
    };
    return Progress;
}());
exports.default = Progress;
