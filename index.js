const chalk = require('chalk');
const fs = require('fs-extra');
const path = require('path');
const Compressor = require('./utils/compressor');
const SshClient = require('./utils/ssh');

class FolderUploadWebpackPlugin {
    constructor(options = {}) {
        if(!options.folder) {
            throw new Error('folder not set')
        }
        options.port = options.port || '22';
        options.clear = options.port || false;
        options.compress = options.compress || 0;
        options.logging = !options.logging ? false : options.logging;
        options.progress = !options.progress ? true : options.progress;
        options.folderName = options.folder.match(/([^\/]*)\/*$/)[1];
        options.firstEmit = options.firstEmit === undefined ? true : options.firstEmit;
        options.chmod = !options.chmod ? 0o644 : options.chmod;
        options.compressor = options.compressor ? new options.compressor(options.logging, options.progress) : new Compressor(options.logging, options.progress);
        options.archive = options.archive ? options.archive : 'FolderUploadWebpackPlugin.zip';
        options.ssh = options.ssh ? new options.ssh(options.logging, options.progress) : new SshClient(options.logging, options.progress);
        options.unArchive = options.unArchive ? options.unArchive : 'unzip';
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

    async upload(compilation, callback) {
        const {folder, remotePath, logging, clear, folderName, archive, unArchive, chmod, compress, compressor, ssh, ...others} = this.options;
        await ssh.connect({...others});
        if(this.options.firstEmit) {
            this.log('archive creation '+folder+'...', chalk.blue);
            fs.removeSync(path.resolve(__dirname, archive));
            await compressor.compress(this.options);

            this.log('archive created...', chalk.blue);
            try {
                await ssh.exists(remotePath);
                if (clear) {
                    this.log('Clearing remote folder '+formatRemotePath(remotePath, folderName)+' ...', chalk.red);
                    await ssh.exec('rm -rf ' + formatRemotePath(remotePath, folderName));
                }
                try{await ssh.exec('rm ' + formatRemotePath(remotePath, archive));}catch (e) {}
            } catch (e) {
                await ssh.mkdir(formatRemotePath(remotePath), true);
            }
        }
        // dd();

        this.options.firstEmit = false;

        this.log('Uploading...', chalk.green);
        await ssh.sendFile(path.resolve(__dirname, archive), formatRemotePath(remotePath, archive));

        this.log('cd ' + remotePath + ' && '+unArchive+' ' + archive, chalk.blue)
        await ssh.exec('cd ' + formatRemotePath(remotePath, '') + ' && '+unArchive+' ' + archive);
        // await ssh.exec('ln -s '+formatRemotePath(remotePath, '')+' ' + formatRemotePath(remotePath, ''));
        await ssh.chmod(formatRemotePath(remotePath, folderName), chmod);

        this.log('clear...', chalk.red);
        await ssh.delete(formatRemotePath(remotePath, archive));
        await fs.removeSync(path.resolve(__dirname, archive));

        await ssh.end();

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
    return (remotePath + '/' + filePath).replace(/\\/g, '/').replace(/\.\//g, "").replace(/\/\//g, "/");
}

module.exports = FolderUploadWebpackPlugin;
