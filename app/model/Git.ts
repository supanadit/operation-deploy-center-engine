// Author Supan Adit Pratama <supanadit@gmail.com>
import { OperatingSystemOperation }             from '../helper/OperatingSystemOperation';
import { archiveStore, gitRepoStore, gitStore } from '../../config/setting';

const recursive = require('recursive-readdir-synchronous');
const fs = require('fs');
const rimraf = require('rimraf');
const tomlify = require('tomlify-j0.4');
const toml = require('toml');
const ora = require('ora');

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
            if (this.isRepositotyExist()) {
                this.cloned = true;
            }
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

    getArchiveLocation(): string {
        return archiveStore.concat('/').concat(this.getProjectName()).concat('.zip');
    }

    clone() {
        if (!this.invalidURL) {
            const myOs: OperatingSystemOperation = new OperatingSystemOperation();
            myOs.gitClone(this, true);
        }
    }

    compress() {
        if (!this.invalidURL) {
            if (this.isExists()) {
                const myOs: OperatingSystemOperation = new OperatingSystemOperation();
                myOs.gitZIP(this, true);
            }
        }
    }

    isExists(): boolean {
        return fs.existsSync(this.getConfigFileLocation());
    }

    isArchiveExist(): boolean {
        return fs.existsSync(this.getArchiveLocation());
    }

    isRepositotyExist(): boolean {
        let result: boolean = false;
        if (this.getRepositorySaveLocation() != '') {
            result = fs.existsSync(this.getRepositorySaveLocation());
        }
        return result;
    }

    delete(): void {
        const spinner = ora(`Pleasewait.. Removing ${this.url}\n`).start();
        if (this.isExists()) {
            fs.unlinkSync(this.getConfigFileLocation());
        }
        if (this.getRepositorySaveLocation()) {
            rimraf.sync(this.getRepositorySaveLocation());
        }
        if (this.isArchiveExist()) {
            fs.unlinkSync(this.getArchiveLocation());
        }
        spinner.succeed(`Success Removing Git ${this.url}`);
    }

    createConfigFile(): boolean {
        let result: boolean = false;
        if (!this.invalidURL) {
            if (!this.isExists()) {
                try {
                    let git: Git = this;
                    const toml = tomlify.toToml(git, {space: 2});
                    fs.writeFileSync(this.getConfigFileLocation(), toml);
                } catch (error) {
                    console.log('Error While Create Config for Git Repository', this.url, 'With Error', error);
                }
            }
        }
        return result;
    }
}