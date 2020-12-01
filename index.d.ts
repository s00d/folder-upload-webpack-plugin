import { Plugin } from 'webpack';

export default FolderUploadWebpackPlugin;

declare class FolderUploadWebpackPlugin extends Plugin {
    constructor(options: FolderUploadWebpackPlugin.Options);
}

declare namespace FolderUploadWebpackPlugin {
    interface Options {
        confirmation: boolean,
        server: {host: string, port: string|number, username: string|number, password: string|number},
        paths: () => any,
        clear: boolean,
        logging: boolean,
        progress: boolean,
        firstEmit: boolean,
        archive: string,
        chmod: any,
        ignore: any,
        symlink: { path: string, force: boolean },
        before: Array<any>
        after: Array<any>
    }
}
