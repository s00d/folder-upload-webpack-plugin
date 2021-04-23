export default class Progress {
    private readonly description;
    private readonly length;
    private lastCell;
    constructor(description: string, bar_length: number);
    render(opts: {
        percent: number;
        completed: number;
        total: number;
    }): void;
}
