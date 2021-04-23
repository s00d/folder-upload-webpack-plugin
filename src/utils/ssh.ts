import * as console from "console";

import {Client as Ssh2Client, ConnectConfig, Client} from "ssh2";
import SftpClient from "ssh2-sftp-client";
import chalk, {Chalk} from "chalk";
import path from "path";
import ProgressBar from "./ProgressBar";
import {clearTimeout} from "timers";
const fs = require('fs')

const promiseRepeat = function(promise: () => Promise<any>, ms = 3000, attempt = 0) {
  return new Promise((resolve, reject) => {
    promiseTimeout(promise, ms).then(result => {
      resolve(result);
    }).catch(async (err) => {
      attempt++;
      if(attempt < 3) return await promiseRepeat(promise, ms, attempt);
      reject(err);
    });
  })
}

const promiseTimeout = function(promise: () => Promise<any>, ms = 3000){
  let timeout = new Promise((resolve, reject) => {
    let id = setTimeout(() => {
      clearTimeout(id);
      reject('Timed out in '+ ms + 'ms.')
    }, ms)
  })
  return Promise.race([
    promise,
    timeout
  ])
}

export default class SshClient {
  private readonly logging: boolean|undefined;
  private progress: boolean;
  private options: ConnectConfig;
  private sftp: SftpClient;
  private streams: number = 10;

  constructor(log:boolean|undefined = false, progress = true, streams = 10) {
      this.logging = log;
      this.progress = progress;
      this.streams = streams
  }

  async connect(options: ConnectConfig = {}) {
      this.options = options;
      this.sftp = new SftpClient();
      await this.sftp.connect({...this.options});
  }

  async ssh2connect(config: ConnectConfig): Promise<Client> {
      return await new Promise((resolve, reject) => {
        let conn = new Ssh2Client();
        conn.on('ready', () => resolve(conn)).on('error', reject).connect(config)
        return conn;
      })
  }

  async exists(remotePath:string) {
    let exits = await this.sftp.exists(remotePath);
    return !!exits;
  }

  async mkdir(remotePath:string, recursive?: boolean) {
      return await this.sftp.mkdir(remotePath, recursive);
  }

  async rmdir(remotePath:string) {
    return await this.sftp.rmdir(remotePath);
  }

  async sendFile(files: Array<{ remotePath:string,name:string,fillPath:string }>) {
    let self = this;
    let uploaded = 0;

    const pb = new ProgressBar('Sending...', 20);

    if (files.length > 0) {
      let sliced_array: Array<Array<{ remotePath:string,name:string,fillPath:string }>> = [];
      let i = 0;
      files.map((item) => {
        if(!sliced_array[i]) sliced_array[i] = []
        sliced_array[i].push(item);
        if(sliced_array[i].length > this.streams) i++;
      });

      for (let i in sliced_array) {
        await Promise.all(sliced_array[i].map(file => {
          if (!fs.existsSync(file.fillPath)) {
            throw new Error(`File: ${file.fillPath} not exist!`)
          }
          let remoteFile = path.resolve(file.remotePath + file.name);
          this.log('Put: ' + file.fillPath + ' to server ' + remoteFile, chalk.yellow);
          return this.sftp.fastPut(file.fillPath, remoteFile, {mode: 0o777}).then(result => {
            uploaded++;
            self.progress && pb.render({
              percent: parseFloat((uploaded / files.length).toFixed(4)),
              completed: uploaded,
              total: files.length,
            })
          }).catch(err => {
            this.log(err, chalk.red.bold)
            return async function retry() {
              return await self.sftp.fastPut(file.fillPath, remoteFile, {mode: 0o777});
            }();
          });
        })).catch(err => {
          this.log(err, chalk.red.bold)
        });
      }


    }
  }
  async symlink(remotePath: string) {
      return await this.sftp.mkdir(remotePath, true);
  }

  async delete(path: string) {
      return await this.sftp.delete(path);
  }

  async chmod(path: string, chmod: number|string) {
      return await this.sftp.chmod(path, chmod);
  }

  async end() {
      await this.sftp.end();
  }

  log(text: string, formatter:Chalk = chalk) {
      if(!this.logging) {
          return;
      }
      console.log(formatter(text));
  }
}
