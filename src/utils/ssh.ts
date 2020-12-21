import * as console from "console";

import {Client as Ssh2Client, ConnectConfig, Client} from "ssh2";
import SftpClient from "ssh2-sftp-client";
import chalk, {Chalk} from "chalk";
import path from "path";
import ProgressBar from "./ProgressBar";

export default class SshClient {
  private readonly logging: boolean|undefined;
  private progress: boolean;
  private options: ConnectConfig;
  private sftp: SftpClient;

  constructor(log:boolean|undefined = false, progress = true) {
      this.logging = log;
      this.progress = progress;
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

  async upload(fillPath: string, remoteFile: string, max_repeat = 0):Promise<string> {
    return await this.sftp.fastPut(fillPath, remoteFile, {}).catch((err) => {
      this.log(err);
      max_repeat++;
      if(max_repeat > 3) {
        throw new Error('repeat error!')
      }
      return this.upload(fillPath, remoteFile, max_repeat)
    });
  }

  async sendFile(files: Array<{ remotePath:string,name:string,fillPath:string }>) {
    let self = this;
    let uploaded = 0;

    const pb = new ProgressBar('Sending...', 20);

    if (files.length > 0) {
      let sliced_array = [];
      for (let i = 0; i < files.length; i += 99) {
        sliced_array.push(files.slice(i, i + 99));
      }

      for (let i in sliced_array) {
        await Promise.all(sliced_array[i].map(file => {
            let remoteFile = path.resolve(file.remotePath + file.name);
            this.log('Put: ' + file.fillPath + ' to server ' + remoteFile, chalk.yellow);
            return this.upload(file.fillPath, remoteFile).then(result => {
                if (result) {
                  uploaded++;
                  self.progress && pb.render({
                    percent: parseFloat((uploaded / files.length).toFixed(4)),
                    completed: uploaded,
                    total: files.length,
                  })
                }
              })
          }
        ));
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
