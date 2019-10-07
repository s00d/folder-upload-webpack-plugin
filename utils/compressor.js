const archiver = require('archiver');
const chalk = require('chalk');
const fs = require('fs-extra');
const path = require('path');
const ProgressBar = require('./ProgressBar');

module.exports = class Compressor {
    constructor(log = false) {
        this.logging = log;
    }

    compress(from, to, compress) {
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

    log(text, formatter = chalk) {
        if(!this.logging) {
            return;
        }
        console.log(formatter(text));
    }
};
