// Author Supan Adit Pratama <supanadit@gmail.com>
import { OperatingSystemOperation }         from '../helper/OperatingSystemOperation';
import { gitRepoStore, gitStore, sshStore } from '../../config/setting';
import { ShellSecureModel }                 from './ShellSecure';

const recursive = require('recursive-readdir-synchronous');
const fs = require('fs');
const tomlify = require('tomlify-j0.4');
const toml = require('toml');

export interface GitModel {
    url: string;
}

export class Git implements GitModel {
    url: string;

    cloned: boolean = false;
    protected location: string = '';

    protected urlType: string; // SSH / HTTPS / HTTP ( Currently Only Support HTTP / HTTPS )
    protected projectName: string;

    protected invalidURL: boolean = true;

    constructor(git: GitModel) {
        this.url = git.url;
        this.urlType = '';
        this.projectName = '';

        const http = 'http';
        const https = 'https';
        const url = this.url;
        let isHTTPS = false;
        let isHTTP = false;

        // Verify If it HTTPS
        if (url.slice(0, https.length) == https) {
            isHTTPS = true;
            this.urlType = 'HTTPS';
        } else {
            // Verify If it HTTP
            if (url.slice(0, http.length) == http) {
                isHTTP = true;
                this.urlType = 'HTTP';
            } else {
                // If Not HTTPS / HTTP it could be SSH Maybe
                this.urlType = 'Unknown';
            }
        }

        // If it HTTP / HTTPS
        if (isHTTP || isHTTPS) {
            this.invalidURL = false;
            const splitURL: Array<string> = url.split('/').slice(2);
            this.projectName = splitURL[splitURL.length - 1].split('.')[0];
            this.location = gitRepoStore.concat('/').concat(this.projectName);
        }
    }

    getProjectName(): string {
        return this.projectName;
    }

    isInvalidURL(): boolean {
        return this.invalidURL;
    }

    getRepositorySaveLocation(): string {
        return this.location;
    }

    getConfigFileLocation(): string {
        return gitStore.concat('/').concat(this.getProjectName()).concat('.toml');
    }

    clone() {
        if (!this.invalidURL) {
            const myOs: OperatingSystemOperation = new OperatingSystemOperation();
            myOs.gitClone(this, true);
        }
    }

    isExists(): boolean {
        const files = recursive(gitStore);
        const allSSH = files.map((x: any) => {
            const pathSplit = x.split('/');
            const fileName = pathSplit[pathSplit.length - 1].split('.');
            return fileName[0];
        });
        return allSSH.some((x: any) => x == this.projectName);
    }

    createConfigFile(): boolean {
        let result: boolean = false;
        if (!this.invalidURL) {
            if (!this.isExists()) {
                try {
                    let git: Git = this;
                    const toml = tomlify.toToml(git, {space: 2});
                    fs.writeFile(this.getConfigFileLocation(), toml, (err: any) => {
                        if (err == null) {
                            result = true;
                        }
                    });
                } catch (error) {
                    console.log('Error While Create Config for Git Repository', this.url, 'With Error', error);
                }
            }
        }
        return result;
    }
}