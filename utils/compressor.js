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

    async compress(options = {}) {
        const {folder, folderName, archive, compress} = options;
        const pb = new ProgressBar('Archiving...', 50);
        // const fileSize = this.getFileSizeInBytes(path.resolve(__dirname, archive));
        const output = fs.createWriteStream(path.resolve(__dirname, '../'+archive));
        const arch = archiver('zip', {
            zlib: { level: compress } // Sets the compression level.
        });
        await arch.pipe(output);
        await arch.directory(folder, folderName);
        await new Promise((resolve, reject) => {
            getSize(folder, (err, size) => {
                if (err) { throw err; }
                size = size < 0 ? -Number(size) : Number(size);

                // console.log('dir: ' + folder + ' -' +size + ' bytes');
                // console.log((size / 1024 / 1024).toFixed(2) + ' MB');

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
                arch.on('progress', (progress) => {
                    const percent = (progress.fs.processedBytes / size).toFixed(4);
                    this.progress && pb.render({
                        percent: percent,
                        completed: this.bytesToSize(progress.fs.processedBytes),
                        total: this.bytesToSize(size),
                    })
                });
                arch.finalize();
            });

        });
    }

    bytesToSize(bytes) {
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        if (bytes == 0) return '0 Byte';
        const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
        return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
    }

    log(text, formatter = chalk) {
        if(!this.logging) {
            return;
        }
        console.log(formatter(text));
    }
};
