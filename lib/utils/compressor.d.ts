import { Chalk } from "chalk";
export default class Compressor {
    private logging;
    constructor(log?: boolean);
    compress(from: string, to: string, compress: number): Promise<unknown>;
    log(text: string, formatter?: Chalk): void;
}
