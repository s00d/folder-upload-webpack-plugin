const archiver = require('archiver');
const chalk = require('chalk');
const fs = require('fs-extra');
const path = require('path');
const ProgressBar = require('./ProgressBar');
const getSize = require('get-folder-size');

module.exports = class Compressor {
    constructor(log = false, progress = true) {
        this.logging = log;
        this.progress = progress;
    }

    async compress(from, to, compress) {
        const pb = new ProgressBar('Archiving...', 20);
        // const fileSize = this.getFileSizeInBytes(path.resolve(__dirname, archive));
        const output = fs.createWriteStream(path.resolve(__dirname, '../'+to));
        const arch = archiver('zip', {
            zlib: { level: compress } // Sets the compression level.
        });
        await arch.pipe(output);
        await arch.append(fs.createReadStream(from), { name: path.parse(from).base });
        await new Promise((resolve, reject) => {
            // handle success
            output.on('warning', (err) => {
                if (err.code !== 'ENOENT') {
                    throw new Error(err)
                }
            });
            output.on(`error`, reject);
            output.on('close', () => {
                this.log(arch.pointer() + ' total bytes', chalk.bold.blue);
                resolve();
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
