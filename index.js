const chalk = require('chalk');
const fs = require('fs-extra');
const path = require('path');
const SshClient = require('./utils/ssh');
const readline = require("readline-sync");

isObject = function(a) {
  return (!!a) && (a.constructor === Object);
};
isArray = function(a) {
  return (!!a) && (a.constructor === Array);
};

class FolderUploadWebpackPlugin {
    constructor(options = {}) {
        if(!options.paths) {
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
        options.pathsClear = new RegExp(options.pathsClear ? options.pathsClear : '', 'gui');
        options.confirmation = options.confirmation ? options.confirmation : false;

        this.options = options;
        this.upload = this.upload.bind(this);
    }
    apply(compiler) {
        // for different webpack version
        if (compiler.hooks) {
            compiler.hooks.afterEmit.tap('after-emit', this.upload);
            // compiler.hooks.beforeRun.tap('before-run', this.upload);
        } else {
            compiler.plugin('after-emit', this.upload);
            // compiler.plugin('before-run', this.upload);
        }
    }

    pathConverter(string, size = 0) {
        return {
            name: path.basename(string),
            path: path.dirname(string),
            remotePath: path.dirname(string).replace(this.options.pathsClear, '') + '/',
            fillPath: string,
            size: size
        }
    }

    async walk(dirs) {
      let list = [];
        for(let i in dirs) {
          const stat = await fs.stat(dirs[i]);
          if (!stat.isDirectory()) {
            if(!this.options.ignore || !path.join(dirs[i]).match(this.options.ignore)){
              list.push(this.pathConverter(path.join(dirs[i]), stat.size));
            }
            continue;
          }

          const files = await fs.readdir(dirs[i]);
          for (const file of files) {
            const stat = await fs.stat(path.join(dirs[i], file));
            if (stat.isDirectory()) {
              list.concat(this.walk(path.join(dirs[i], file)))
              // await this.walk(path.join(dirs[i], file));
            } else {
              if(!this.options.ignore || !path.join(dirs[i], file).match(this.options.ignore)){
                list.push(this.pathConverter(path.join(dirs[i], file), stat.size));
              }
            }
          }
        }

        return list
    }

    async upload(compilation, callback) {
      const {paths, remotePath, clear, ssh, chmod, server} = this.options;

      if(!this.options.confirmation || readline.keyInYN(chalk.bold.red("\nAre you sure you want to replace the server?"))) {
        if(this.options.firstEmit) {
          for(let i in server) {
            let filesList = await this.walk(paths);

            server[i].port = server[i].port || '22';
            await ssh.connect(server[i]);

            if (clear) {
              this.log('Clearing remote folder '+formatRemotePath(remotePath)+'* ...', chalk.red);
              await ssh.exec('rm -rf ' + formatRemotePath(remotePath)+ '*');
            }

            let dirList = {};
            for(let i in filesList) {
              try {
                let dir = formatRemotePath(remotePath, filesList[i].remotePath);
                if(dirList.hasOwnProperty(dir)) continue;
                dirList[dir] = dir;

                if(!await ssh.exists(dir)) {
                  this.log('MAKE remote folder '+dir+' ...', chalk.green);
                  await ssh.mkdir(dir, true).catch(() => null);
                  await ssh.chmod(dir, chmod).catch(() => null);
                }
              } catch (e) {}
            }

            this.log('Uploading...', chalk.green);
            await ssh.sendFile(filesList, remotePath);
            this.log('end', chalk.green);
            await ssh.end();
          }
        }
      }

      this.options.firstEmit = false;

      if(this.options.symlink) {
        this.log('Making symlink...', chalk.green);
        this.createSimlinks(this.options.symlink, compilation.options.output.path, clear)
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
        for(let i in dirs) {
          if(!fs.statSync(path.join(parentPath, dirs[i])).isDirectory() || dirs[i] === ignore)  continue;
          fs.removeSync(path.join(parentPath, dirs[i]));
        }
      }
    }

    log(text, formatter = chalk) {
        if(!this.options.logging) {
            return;
        }
        console.log(formatter(text));
    }
}

function formatRemotePath(remotePath, filePath = '') {
    return (remotePath + '/' + filePath).replace(/\\/g, '/').replace(/\.\//g, "").replace(/\/\/+/g, "/");
}

module.exports = FolderUploadWebpackPlugin;
