const ssh2Client = require('ssh2').Client;
const sftpClient = require('ssh2-sftp-client');
const fs = require('fs-extra');
const chalk = require('chalk');
const path = require('path');
const ProgressBar = require('./ProgressBar');

module.exports = class SshClient {
    constructor(log = false, progress = true) {
        this.logging = log;
        this.progress = progress;
    }

    async connect(options = {}) {
        this.options = options;
        this.conn = await this.ssh2connect({...options});
        this.sftp = new sftpClient();
        await this.sftp.connect({...options});
    }

    async ssh2connect(config) {
        return await new Promise((resolve, reject) => {
            let conn = new ssh2Client();
            conn.on('ready', () => resolve(conn)).on('error', reject).connect(config)
        })
    }

    async exec(cmd, config = {}) {
        return await new Promise((resolve, reject) => {
            this.log('exec: ' + cmd, chalk.blue);
            this.conn.exec(cmd, config, (err, stream)  =>{
                if (err) {
                    return reject(err)
                }
                stream.on('close', (code, signal) => {
                    this.log('Streeam :: close :: code: '+code+', signal: ' + signal, chalk.blue);
                    resolve();
                }).on('data', (data) => {
                    // this.log('STDOUT: ' + data, chalk.blue)
                }).stderr.on('data', (data) => {
                    this.log('STDERR: '+ data, chalk.red);
                    reject();
                })
            })
        })
    }

    async exists(remotePath) {
        return await this.sftp.exists(remotePath);
    }

    async mkdir(remotePath) {
        return await this.sftp.mkdir(remotePath, true);
    }

    async sendFile(archive, remotePath) {
        return await new Promise((resolve, reject) => {
            this.log('Put: '+archive+' to server '+remotePath, chalk.yellow);
            const fileSize = this.getFileSizeInBytes(archive);
            const pb = new ProgressBar('Sending...', 50);
            this.sftp.fastPut(archive, remotePath, {
                step: step => {
                    const percent = (step / fileSize).toFixed(4);
                    this.progress && pb.render({
                        percent: percent,
                        completed: this.bytesToSize(step),
                        total: this.bytesToSize(fileSize),
                    })
                }
            }).catch((err) => {
                // upload err checker, if err end with "No such file", it will make dir and retry
                if (err.toString().includes("No such file")) {
                    this.log(`Вolder: ${remotePath} not exists,make a folder and retrying...`, chalk.yellow);
                    return async function retry() {
                        await sftp.mkdir(remotePath, true).catch(() => null);
                        await sftp.put(path.resolve(__dirname, archive), formatRemotePath(remotePath, archive));
                        resolve();
                    }();
                }else {
                    reject();
                }
            })
                .then(result => {
                    // if (result) {
                    //     uploadedFiles.push(file);
                    //     log && log.progress && pb.render({
                    //         percent: (uploadedFiles.length / files.length).toFixed(4),
                    //         completed: uploadedFiles.length,
                    //         total: files.length,
                    //     })
                    // }
                    resolve();
                });
        });
    }

    getFileSizeInBytes(filename) {
        const stats = fs.statSync(filename);
        return stats.size;
    }

    async symlink(remotePath) {
        return await this.sftp.mkdir(remotePath, true);
    }

    async delete(path) {
        return await this.sftp.delete(path);
    }

    async chmod(path, chmod) {
        return await this.sftp.chmod(path, chmod);
    }

    async end() {
        await this.conn.end();
        await this.sftp.end();
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
}
