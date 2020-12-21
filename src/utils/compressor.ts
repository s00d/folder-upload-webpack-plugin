import archiver from "archiver";
import chalk, {Chalk} from "chalk";
import fs from "fs-extra";
import path from "path";

export default class Compressor {
    private logging: boolean;
    constructor(log = false) {
        this.logging = log;
    }

    compress(from: string, to: string, compress: number) {
        const output = fs.createWriteStream(path.resolve(to));
        const arch = archiver('zip', {
            zlib: { level: compress } // Sets the compression level.
        });
        arch.pipe(output);
        arch.append(fs.createReadStream(from), { name: path.parse(from).base });
        return new Promise((resolve, reject) => {
            // handle success
            output.on('warning', (err) => {
                if (err.code !== 'ENOENT') {
                    throw new Error(err)
                }
            });
            output.on(`error`, reject);
            output.on('close', () => {
                this.log(arch.pointer() + ' total bytes', chalk.bold.blue);
                resolve(to);
            });
            arch.finalize();
        });
    }

    log(text: string, formatter:Chalk = chalk) {
        if(!this.logging) {
            return;
        }
        console.log(formatter(text));
    }
};
