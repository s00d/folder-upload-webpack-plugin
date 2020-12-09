import {execSync, spawnSync} from "child_process";
const SshClient = require('./utils/ssh');
import * as webpack from 'webpack'
import * as os from "os";
import * as path from "path";
import * as fs from "fs-extra";
import chalk from "chalk";
import readline from "readline-sync";
import {Chalk} from "chalk";

function isObject(a: any) {
  return (!!a) && (a.constructor === Object);
}
function isArray(a: any) {
  return (!!a) && (a.constructor === Array);
}

interface Options {
  confirmation?: boolean,
  server: Array<{host: string, port: string|number, username: string|number, password: string|number}>,
  paths?: () => {[key: string]: string},
  clear?: boolean,
  enable?: boolean,
  logging?: boolean,
  progress?: boolean,
  firstEmit?: boolean,
  archive?: string,
  chmod?: any,
  ignore?: any,
  symlink?: { path: string, force: boolean },
  before?: Array<any>
  after?: Array<any>
  ssh?: any
}

class FolderUploadWebpackPlugin {
  private pathList: any[];
  private cl: {[key: string]: boolean };
  private options: Options;
  private paths: {[key: string]: string};


  constructor(options: Options = {server: []}) {
    if (!options.paths) {
      throw new Error('paths not set')
    }

    options.enable = options.enable === undefined ? true : options.enable;
    options.clear = options.clear || false;
    options.logging = !options.logging ? false : options.logging;
    options.progress = !options.progress ? true : options.progress;
    // options.folderName = options.folder.match(/([^\/]*)\/*$/)[1];
    options.firstEmit = options.firstEmit === undefined ? true : options.firstEmit;
    options.chmod = !options.chmod ? 0o644 : options.chmod;
    options.archive = options.archive ? options.archive : 'FolderUploadWebpackPlugin.zip';
    options.ignore = options.ignore ? options.ignore : null;
    options.ssh = options.ssh ? new options.ssh(options.logging, options.progress) : new SshClient(options.logging, options.progress);
    options.confirmation = options.confirmation ? options.confirmation : false;
    this.paths = options.paths ? options.paths() : {};
    options.after = options.after ? options.after : [];
    options.before = options.before ? options.before : [];


    this.pathList = [];
    this.cl = {};

    this.options = options;
    this.upload = this.upload.bind(this);
  }

  apply(compiler: webpack.Compiler) {
    if(!this.options.enable) return;
    if (compiler.hooks) {
      compiler.hooks.done.tapAsync('folder-upload-webpack-plugin', this.upload);
    } else {
      compiler.plugin('folder-upload-webpack-plugin', this.upload);
    }
  }

  pathConverter(local: string, remote: string, size = 0) {
    return {
      name: path.basename(local),
      path: path.dirname(local),
      remotePath: path.resolve(remote) + '/',
      fillPath: local,
      size: size
    }
  }

  walk(dirs: {[key: string]: string}) {
    for (let i in dirs) {
      const stat = fs.statSync(i);
      if (!stat.isDirectory()) {
        if (!this.options.ignore || !path.join(i).match(this.options.ignore)) {
          this.pathList.push(this.pathConverter(path.join(i), path.join(dirs[i]), stat.size));
          this.cl[path.join(dirs[i], '/')] = true;
        }
        continue;
      }

      const files = fs.readdirSync(i);
      for (const file of files) {
        const stat = fs.statSync(path.join(i, file));
        if (stat.isDirectory()) {
          let data: {[key: string]: string} = {};
          data[path.join(i, file)] = path.join(dirs[i], file);
          this.pathList.concat(this.walk(data))
        } else {
          if (!this.options.ignore || !path.join(i, file).match(this.options.ignore)) {
            this.pathList.push(this.pathConverter(path.join(i, file), path.join(dirs[i]), stat.size));
            this.cl[path.join(dirs[i], '/')] = true;
          }
        }
      }
    }

    return [this.pathList, Object.keys(this.cl)]
  }

  handleScript(script: string) {
    if (os.platform() === 'win32') {
      const buffer = execSync(script, {stdio: 'inherit'});
    } else {
      const [command, ...args] = script.split(' ');
      spawnSync(command, args, {stdio: 'inherit'});
    }
  }

  async upload(compilation: webpack.Stats, callback?: Function) {
    const {clear, ssh, chmod, server} = this.options;

    if (this.options.before && this.options.before.length) {
      for (let i in this.options.before) {
        this.handleScript(this.options.before[i])
      }
    }

    if (!this.options.confirmation || readline.keyInYN(chalk.bold.red("\nAre you sure you want to replace the server?"))) {
      if (this.options.firstEmit) {
        for (let i in server) {
          let [filesList, cl] = await this.walk(this.paths);

          server[i].port = server[i].port || '22';
          await ssh.connect(server[i]);

          for (let i in this.paths) {
            if (clear) {
              try {
                this.log('Clearing remote folder ' + this.paths[i] + '* ...', chalk.red);
                await ssh.exec('rm -rf ' + formatRemotePath(this.paths[i]) + '*');
              } catch (e) {
              }
            }
          }

          for (let i in cl) {
            let dir = formatRemotePath(cl[i]);
            try {
              if (!await ssh.exists(dir)) {
                this.log('MAKE remote folder ' + dir + ' ...', chalk.green);
                await ssh.mkdir(dir, true).catch(() => null);
                await ssh.chmod(dir, chmod).catch(() => null);
              }
            } catch (e) {
            }
          }

          this.log('Uploading...', chalk.green);
          await ssh.sendFile(filesList);
          this.log('end', chalk.green);
          await ssh.end();
        }
      }
    }

    this.options.firstEmit = false;

    if (this.options.symlink) {
      this.log('Making symlink...', chalk.green);
      this.createSimlinks(this.options.symlink, compilation.compilation.outputPath, clear)
    }

    if (this.options.after && this.options.after.length) {
      for (let i in this.options.after) {
        this.handleScript(this.options.after[i])
      }
    }

    if (callback) {
      callback();
    }

  }

  createSimlinks(options: { path: string, force: boolean }, inputPath: string, clear: boolean|undefined) {
    if (options.force || fs.existsSync(inputPath)) {
      const baseDir = process.cwd();
      process.chdir(inputPath);
      const origin = path.relative(path.dirname(options.path), inputPath);
      this.log('Symlink path: ' + origin, chalk.green);
      try {
        if (clear) {
          if (fs.existsSync(options.path)) {
            fs.removeSync(options.path);
          }
        }
        fs.readlinkSync(options.path); // Raises if symlink doesn't exist
        fs.unlinkSync(options.path);
      } catch (e) {
        // symlink doesn't exist
      } finally {
        fs.symlinkSync(origin, options.path);
      }

      process.chdir(baseDir);
    }

    if (clear) {
      const parentPath = path.dirname(inputPath);
      const ignore = path.basename(inputPath);
      const dirs = fs.readdirSync(parentPath);
      for (let i in dirs) {
        if (!fs.statSync(path.join(parentPath, dirs[i])).isDirectory() || dirs[i] === ignore) continue;
        fs.removeSync(path.join(parentPath, dirs[i]));
      }
    }
  }

  log(text: string, formatter:Chalk = chalk.blue) {
    if (!this.options.logging) {
      return;
    }
    console.log(formatter(text));
  }
}

function formatRemotePath(remotePath: string, filePath = '') {
  return (remotePath + '/' + filePath).replace(/\\/g, '/').replace(/\.\//g, "").replace(/\/\/+/g, "/");
}

module.exports = FolderUploadWebpackPlugin;
