import * as webpack from 'webpack';
import { Chalk } from "chalk";
import { ConnectConfig } from "ssh2";
export interface Options {
    confirmation?: boolean;
    server: Array<ConnectConfig>;
    paths?: () => {
        [key: string]: string;
    };
    clear?: boolean;
    enable?: boolean;
    logging?: boolean;
    progress?: boolean;
    firstEmit?: boolean;
    archive?: string;
    chmod?: any;
    ignore?: any;
    symlink?: {
        path: string;
        force: boolean;
    };
    before?: Array<any>;
    after?: Array<any>;
    ssh?: any;
}
export default class FolderUploadWebpackPlugin {
    private readonly pathList;
    private readonly cl;
    private readonly options;
    private readonly paths;
    private ssh;
    constructor(options?: Options);
    apply(compiler: webpack.Compiler): void;
    pathConverter(local: string, remote: string, size?: number): {
        name: string;
        path: string;
        remotePath: string;
        fillPath: string;
        size: number;
    };
    walk(dirs: {
        [key: string]: string;
    }): any[][];
    handleScript(script: string): void;
    upload(compilation: webpack.Stats, callback?: Function): Promise<void>;
    createSimlinks(options: {
        path: string;
        force: boolean;
    }, inputPath: string, clear: boolean | undefined): void;
    log(text: string, formatter?: Chalk): void;
}
