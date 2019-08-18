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
}

export class ShellSecure implements ShellSecureModel {
    host: string;
    password: string;
    port: string;
    username: string;

    protected globalMessage: string = 'No Message';

    constructor(ssh: ShellSecureModel) {
        this.host = ssh.host;
        this.password = ssh.password;
        this.port = ssh.port;
        this.username = ssh.username;
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
                fs.writeFile(sshStore.concat('/').concat(filename), toml, (err: any) => {
                    if (err == null) {
                        this.globalMessage = 'Success Save SSH Account';
                        result = true;
                    } else {
                        this.globalMessage = 'Unknown Error';
                    }
                });
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