import {stdout as slog} from "single-line-log";

export default class Progress {
    private readonly description: string;
    private readonly length: number;
    private lastCell: number;

    constructor(description:string, bar_length:number) {
        this.description = description || 'Progress';
        this.length = bar_length || 25;
        this.lastCell = -1;
    }

    render(opts: {percent: number, completed: number, total: number}) {
        const cell_num = Math.floor(opts.percent * this.length);
        if(this.lastCell === cell_num) return;
        this.lastCell = cell_num;
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
    }
}
