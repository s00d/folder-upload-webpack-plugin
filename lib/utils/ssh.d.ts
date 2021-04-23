import { ConnectConfig, Client } from "ssh2";
import { Chalk } from "chalk";
export default class SshClient {
    private readonly logging;
    private progress;
    private options;
    private sftp;
    private streams;
    constructor(log?: boolean | undefined, progress?: boolean, streams?: number);
    connect(options?: ConnectConfig): Promise<void>;
    ssh2connect(config: ConnectConfig): Promise<Client>;
    exists(remotePath: string): Promise<boolean>;
    mkdir(remotePath: string, recursive?: boolean): Promise<string>;
    rmdir(remotePath: string): Promise<string>;
    sendFile(files: Array<{
        remotePath: string;
        name: string;
        fillPath: string;
    }>): Promise<void>;
    symlink(remotePath: string): Promise<string>;
    delete(path: string): Promise<string>;
    chmod(path: string, chmod: number | string): Promise<string>;
    end(): Promise<void>;
    log(text: string, formatter?: Chalk): void;
}
