const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const SshClient = require('./utils/ssh');
const readline = require("readline-sync");
const os = require('os');
const {spawnSync, execSync} = require('child_process');

isObject = function (a) {
  return (!!a) && (a.constructor === Object);
};
isArray = function (a) {
  return (!!a) && (a.constructor === Array);
};

class FolderUploadWebpackPlugin {
  constructor(options = {}) {
    if (!options.paths) {
      throw new Error('paths not set')
    }
    options.server = isObject(options.server) ? [options.server] : options.server;

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
    options.paths = options.paths ? options.paths() : {};
    options.after = options.after ? options.after : [];
    options.before = options.before ? options.before : [];


    this.pathList = [];
    this.cl = {};

    this.options = options;
    this.upload = this.upload.bind(this);
  }

  apply(compiler) {
    if (compiler.hooks) {
      compiler.hooks.afterEmit.tap('folder-upload-webpack-plugin', this.upload);
      // compiler.hooks.beforeRun.tap('before-run', this.upload);
    } else {
      compiler.plugin('folder-upload-webpack-plugin', this.upload);
      // compiler.plugin('before-run', this.upload);
    }
  }

  pathConverter(local, remote, size = 0) {
    return {
      name: path.basename(local),
      path: path.dirname(local),
      remotePath: path.resolve(remote) + '/',
      fillPath: local,
      size: size
    }
  }

  walk(dirs) {
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
          let data = {};
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

  handleScript(script) {
    if (os.platform() === 'win32') {
      const buffer = execSync(script, {stdio: 'inherit'});
    } else {
      const [command, ...args] = script.split(' ');
      spawnSync(command, args, {stdio: 'inherit'});
    }
  }

  async upload(compilation, callback) {
    const {paths, clear, ssh, chmod, server} = this.options;

    if (this.options.before.length) {
      for (let i in this.options.before) {
        this.handleScript(this.options.before[i])
      }
    }

    if (!this.options.confirmation || readline.keyInYN(chalk.bold.red("\nAre you sure you want to replace the server?"))) {
      if (this.options.firstEmit) {
        for (let i in server) {
          let [filesList, cl] = await this.walk(paths);

          server[i].port = server[i].port || '22';
          await ssh.connect(server[i]);

          for (let i in cl) {
            let dir = formatRemotePath(cl[i]);
            if (clear) {
              try {
                this.log('Clearing remote folder ' + dir + '* ...', chalk.red);
                await ssh.exec('rm -rf ' + formatRemotePath(cl[i]) + '*');
              } catch (e) {
              }
            }

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
      this.createSimlinks(this.options.symlink, compilation.options.output.path, clear)
    }

    if (this.options.after.length) {
      for (let i in this.options.after) {
        this.handleScript(this.options.after[i])
      }
    }

    if (callback) {
      callback();
    }

  }

  createSimlinks(options, inputPath, clear) {
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

  log(text, formatter = chalk) {
    if (!this.options.logging) {
      return;
    }
    console.log(formatter(text));
  }
}

function formatRemotePath(remotePath, filePath = '') {
  return (remotePath + '/' + filePath).replace(/\\/g, '/').replace(/\.\//g, "").replace(/\/\/+/g, "/");
}

module.exports = FolderUploadWebpackPlugin;
