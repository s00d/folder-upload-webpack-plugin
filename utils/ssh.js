const Ssh2Client = require('ssh2').Client;
const SftpClient = require('ssh2-sftp-client');
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
        this.conn = await this.ssh2connect({...this.options});
        this.sftp = new SftpClient();
        await this.sftp.connect({...this.options});
    }

    async ssh2connect(config) {
        return await new Promise((resolve, reject) => {
            let conn = new Ssh2Client();
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
                let stdout = Buffer.concat([]);
                stream.on('close', (code, signal) => {
                    // this.log('Streeam :: close :: code: '+code+', signal: ' + signal, chalk.blue);
                    resolve(stdout.toString());
                }).on('data', (data) => {
                    stdout = Buffer.concat([stdout, data]);
                    // this.log('STDOUT: ' + data.toString(), chalk.green)
                }).stderr.on('data', (data) => {
                    this.log('STDERR: '+ data, chalk.red);
                    reject();
                })
            })
        })
    }

    async exists(remotePath) {
        let exits = await this.exec(`[ -d ${remotePath} ] && echo "exits"`);
        return exits === 'exits';
    }

    async mkdir(remotePath) {
        return await this.exec(`mkdir -p ${remotePath}`);
        // return await this.sftp.mkdir(remotePath, true);
    }

    async sendFile(files) {
      let self = this;
      let uploaded = 0;

      const pb = new ProgressBar('Sending...', 20);

      if (files.length > 0) {
        await Promise.all(files.map(file => {
          let remoteFile = path.resolve(file.remotePath + file.name);
          // console.info(file.fillPath, remoteFile);
          this.log('Put: ' + file.fillPath + ' to server ' + remoteFile, chalk.yellow);
          return this.sftp.fastPut(file.fillPath, remoteFile)
            .catch((err) => {
              if (err.toString().includes("No such file")) {
                this.log(`File: "${path.resolve(file.remotePath)}"'s folder not exists,make a folder and retrying...`, chalk.yellow);
                return async function retry() {
                  await self.sftp.mkdir(path.resolve(file.remotePath), true).catch(() => null);
                  return await self.sftp.fastPut(file.fillPath, remoteFile);
                }();
              }
            })
            .then(result => {
              if (result) {
                uploaded++;
                self.progress && pb.render({
                  percent: (uploaded / files.length).toFixed(4),
                  completed: uploaded,
                  total: files.length,
                })
              }
            })
          }
        ));
      }
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

    log(text, formatter = chalk) {
        if(!this.logging) {
            return;
        }
        console.log(formatter(text));
    }
}
