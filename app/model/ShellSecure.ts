// Author Supan Adit Pratama <supanadit@gmail.com>

import { sshStore } from '../../config/setting';

const recursive = require('recursive-readdir-synchronous');
const fs = require('fs');
const tomlify = require('tomlify-j0.4');
const toml = require('toml');

export interface ShellSecureModel {
    host: string;
    username: string;
    password: string;
    port: string;
    uploadPath: string;
}

export class ShellSecure implements ShellSecureModel {
    host: string;
    password: string;
    port: string;
    username: string;
    uploadPath: string;

    protected globalMessage: string = 'No Message';

    constructor(ssh: ShellSecureModel) {
        this.host = ssh.host;
        this.password = ssh.password;
        this.port = ssh.port;
        this.username = ssh.username;
        this.uploadPath = ssh.uploadPath;
    }

    isExists(): boolean {
        const files = recursive(sshStore);
        const allSSH = files.map((x: any) => {
            const pathSplit = x.split('/');
            const fileName = pathSplit[pathSplit.length - 1].split('.');
            return fileName[0];
        });
        return allSSH.some((x: any) => x == this.host);
    }

    save(): boolean {
        let result: boolean = false;
        if (!this.isExists()) {
            try {
                let ssh: ShellSecureModel = this;
                const filename = ssh.host.concat('.toml');
                const toml = tomlify.toToml(ssh, {space: 2});
                fs.writeFileSync(sshStore.concat('/').concat(filename), toml);
            } catch (error) {
                this.globalMessage = 'Unknown Error';
                console.log('Error While Saving SSH Account for Host', this.host, 'With Error', error);
            }
        } else {
            this.globalMessage = 'This SSH is Exist';
        }
        return result;
    }

    getMessage(): string {
        return this.globalMessage;
    }

    static fromConfigFile(hostname: string): ShellSecure | null {
        const fileName = sshStore.concat('/').concat(hostname).concat('.toml');
        let ssh: ShellSecure | null = null;
        if (fs.existsSync(fileName)) {
            let dataToml: string = fs.readFileSync(fileName, 'utf-8');
            let sshModel: ShellSecureModel = toml.parse(dataToml);
            ssh = new ShellSecure(sshModel);
        }
        return ssh;
    }

    static getAllShellSecure(): ShellSecure[] {
        const files = recursive(sshStore);
        const allSSH: ShellSecure[] = files.map((x: any) => {
            let dataToml: string = fs.readFileSync(x, 'utf-8');
            let sshModel: ShellSecureModel = toml.parse(dataToml);
            return new ShellSecure(sshModel);
        });
        return allSSH;
    }
}