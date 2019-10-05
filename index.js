const chalk = require('chalk');
const fs = require('fs-extra');
const path = require('path');
const Compressor = require('./utils/compressor');
const SshClient = require('./utils/ssh');

class FolderUploadWebpackPlugin {
    constructor(options = {}) {
        if(!options.paths) {
            throw new Error('paths not set')
        }
        options.server.port = options.server.port || '22';
        options.clear = options.clear || false;
        options.compress = options.compress || 0;
        options.logging = !options.logging ? false : options.logging;
        options.progress = !options.progress ? true : options.progress;
        // options.folderName = options.folder.match(/([^\/]*)\/*$/)[1];
        options.firstEmit = options.firstEmit === undefined ? true : options.firstEmit;
        options.chmod = !options.chmod ? 0o644 : options.chmod;
        options.compressor = options.compressor ? new options.compressor(options.logging, options.progress) : new Compressor(options.logging, options.progress);
        options.archive = options.archive ? options.archive : 'FolderUploadWebpackPlugin.zip';
        options.ssh = options.ssh ? new options.ssh(options.logging, options.progress) : new SshClient(options.logging, options.progress);
        options.unCompress = options.unCompress ? options.unCompress : 'unzip';
        options.pathsClear = new RegExp(options.pathsClear ? options.pathsClear : '', 'gui');


        // options.debug = (debug) => {
        //     console.log(debug)
        // };

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

    pathConverter(string) {
        let basename = path.basename(string);
        let dirname = path.dirname(string);
        let remotePath = path.dirname(string).replace(this.options.pathsClear, '') + '/';
        return {
            name: path.basename(string),
            path: path.dirname(string),
            remotePath: path.dirname(string).replace(this.options.pathsClear, '') + '/',
            fillPath: string
        }
    }

  async walk(dir, fileList = []) {
    const files = await fs.readdir(dir);
    for (const file of files) {
      const stat = await fs.stat(path.join(dir, file));
      if (stat.isDirectory()) {
          fileList = await this.walk(path.join(dir, file), fileList);
      } else {
          fileList.push(this.pathConverter(path.join(dir, file)));
      }
    }
    return fileList
  }

    async upload(compilation, callback) {
      const {paths, pathsClear, remotePath, logging, clear, archive, unCompress, chmod, ssh, server} = this.options;

      if(this.options.firstEmit) {
        await ssh.connect(server);

        let filesList = [];
        let dirList = {};
        for(let i in paths) {
          filesList = await this.walk(paths[i]);
        }
        for(let i in filesList) {
          dirList[filesList[i].remotePath] = filesList[i].remotePath
        }
        dirList = Object.keys(dirList);

        if (clear) {
          this.log('Clearing remote folder '+formatRemotePath(remotePath)+'* ...', chalk.red);
          await ssh.exec('rm -rf ' + formatRemotePath(remotePath)+ '*');
        }

        for(let i in dirList) {
          try {
            await ssh.exists(remotePath);
          } catch (e) {}
          try {
            this.log('MAKE remote folder '+formatRemotePath(remotePath, dirList[i])+' ...', chalk.green);
            await ssh.mkdir(formatRemotePath(remotePath, dirList[i]), true).catch(() => null);
          } catch (e) {}
        }

        this.log('Uploading...', chalk.green);
        await ssh.sendFile(filesList, remotePath);
        this.log('end', chalk.green);
        await ssh.end();
      }
      this.options.firstEmit = false;

      if (callback) {
        callback();
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
