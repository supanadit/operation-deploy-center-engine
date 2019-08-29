// Author Supan Adit Pratama <supanadit@gmail.com>
import { archiveStore, gitRepoStore, gitStore, sshStore } from '../../config/setting';
import { spawn, spawnSync } from 'child_process';
import { Script } from './Script';
import { ShellSecureModel } from './ShellSecure';

const fs = require('fs');
const tomlify = require('tomlify-j0.4');
const ora = require('ora');
const recursive = require('recursive-readdir-synchronous');
const toml = require('toml');

export interface GitModel {
    url: string;
    username?: string;
    password?: string;
    cloned?: boolean;
}

export class Git implements GitModel {
    url: string;
    username?: string;
    password?: string;

    cloned: boolean = false;
    protected location: string = '';

    protected urlType: string; // SSH / HTTPS / HTTP ( Currently Only Support HTTP / HTTPS )
    protected projectName: string;

    protected invalidURL: boolean = true;

    constructor(git: GitModel, isFromLocal: boolean = false) {
        this.url = git.url;
        this.urlType = '';
        this.projectName = '';
        this.username = git.username;
        this.password = git.password;

        const http = 'http';
        const https = 'https';
        const url = this.url;
        let isHTTPS = false;
        let isHTTP = false;
        let isSSH = false;
        if (!isFromLocal) {
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
                    const splitToGetAtSymbol = url.split('@');
                    if (splitToGetAtSymbol.length != 0) {
                        const userGitName = splitToGetAtSymbol[0]; // It should be git
                        const nameLeft = splitToGetAtSymbol[1]; // It should be eg. bitbucket.org:username/repository_name
                        const splitNameLeft = nameLeft.split(':');
                        if (splitNameLeft.length != 0) {
                            const domainName = splitNameLeft[0]; // It should be eg. bitbucket.org / github.com / gitlab.com
                            const usernameAndRepository = splitNameLeft[1]; // It should be eg. username/repository_name
                            const splitUsernameAndRepository = usernameAndRepository.split('/');
                            if (splitUsernameAndRepository.length != 0) {
                                const username = splitUsernameAndRepository[0];
                                const repository_name = splitUsernameAndRepository[1];
                                const repository_name_split = repository_name.split('.');
                                this.projectName = repository_name;
                                if (repository_name_split.length != 0) {
                                    this.projectName = repository_name_split[0];
                                }
                                isSSH = true;
                                this.urlType = 'SSH';
                            } else {
                                this.urlType = 'Unknown';
                            }
                        } else {
                            this.urlType = 'Unknown';
                        }
                    } else {
                        this.urlType = 'Unknown';
                    }
                }
            }

            // If it HTTP / HTTPS
            if (isHTTP || isHTTPS) {
                this.invalidURL = false;
                let currentURL = this.url;
                if (isHTTPS) {
                    currentURL = this.url.slice(https.length);
                } else {
                    currentURL = this.url.slice(http.length);
                }
                const symbolAfterProtocol = '://';
                currentURL = currentURL.slice(symbolAfterProtocol.length);
                const splitUsernameWithLink = currentURL.split('@'); // Split example@example.com/etc.git
                let username = '';
                let domainIndex = 0;
                if (splitUsernameWithLink.length >= 1) {
                    username = splitUsernameWithLink[0];
                    domainIndex = 1;
                    if (this.username == null) {
                        this.username = username;
                    }
                }

                const splitDomainWithLink = splitUsernameWithLink[domainIndex].split('.');
                const hostName = splitDomainWithLink[0]; // Github / Bitbucket / Gitlab
                const splitTLDwithLink = splitDomainWithLink[1].split('/');
                const tldName = splitTLDwithLink[0]; // .com / .org / .net
                const path = splitTLDwithLink.slice(1).join('/');

                const splitURL: Array<string> = url.split('/').slice(2);
                this.projectName = splitURL[splitURL.length - 1].split('.')[0];
                this.location = gitRepoStore.concat('/').concat(this.projectName);
                let linkReplacement = ((this.username) ? this.username : '');
                linkReplacement = ((this.username) ? (
                    (this.password) ? linkReplacement.concat(':').concat(this.password) : ''
                ) : '');
                const fullDomain = hostName.concat('.').concat(tldName);
                linkReplacement = (linkReplacement != '') ? linkReplacement.concat('@').concat(fullDomain) : fullDomain;
                const urlFirst = ((isHTTP) ? http : https).concat(symbolAfterProtocol);
                linkReplacement = urlFirst.concat(linkReplacement).concat('/').concat(path).concat('.git');
                if (username != '' && this.password != null) {
                    this.url = linkReplacement;
                }
                if (this.isRepositotyExist()) {
                    this.cloned = true;
                }
            } else if (isSSH) {
                this.invalidURL = false;
                this.location = gitRepoStore.concat('/').concat(this.projectName);
                if (this.isRepositotyExist()) {
                    this.cloned = true;
                }
            }
        } else {
            if (git.cloned != null) {
                this.cloned = git.cloned;
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

    getArchiveNameOnly(): string {
        return this.getProjectName().concat('.zip');
    }

    clone() {
        if (!this.invalidURL) {
            const commandExecution = spawn('git', ['clone', this.url, this.getRepositorySaveLocation()], {
                shell: true,
            });
            // commandExecution.stderr.pipe(process.stderr);
            // commandExecution.stdout.pipe(process.stdout);
            const spinner = ora(`Please wait, Cloning ${this.url}\n`).start();
            // if (this.password != null) {
            //     for (let x of this.password.split('').concat('\n')) {
            //         commandExecution.stdin.write(x);
            //     }
            // }
            // commandExecution.stdout.setEncoding('utf8');
            // commandExecution.stdout.on('data', function (data) {
            //     console.log('stdout: ' + data);
            // });
            //
            // commandExecution.stderr.setEncoding('utf8');
            // commandExecution.stderr.on('data', function (data) {
            //     console.log('stderr: ' + data);
            // });
            commandExecution.on('close', (code: any) => {
                if (code == 0) {
                    spinner.succeed(`Success Cloning Repository ${this.url}`);
                    this.cloned = true;
                    this.createConfigFile();
                } else {
                    spinner.fail(`Failed to Cloning Repository ${this.url}`);
                }
            });
        }
    }

    compress(specificDirectory: Array<string> = []) {
        if (!this.invalidURL) {
            const compressDirectory = (specificDirectory.length == 0) ? this.getRepositorySaveLocation() : this.getRepositorySaveLocation().concat('/').concat(
                specificDirectory.join('/')
            );
            if (this.isExists()) {
                const commandExecution = spawn('zip', ['-r', this.getArchiveNameOnly(), '.'], {
                    shell: true,
                    cwd: compressDirectory,
                });
                const spinner = ora(`Please wait, Compressing Repository ${this.url}\n`).start();
                commandExecution.on('close', (code: any) => {
                    if (code == 0) {
                        const currentArchive = compressDirectory.concat('/').concat(this.getArchiveNameOnly());
                        const moveExecution = spawn('mv', [currentArchive, this.getArchiveLocation()], {
                            shell: true,
                        });
                        moveExecution.on('close', (code: any) => {
                            if (code == 0) {
                                spinner.succeed(`Success Compressing Repository ${this.url}`);
                            } else {
                                spinner.fail(`Failed to Compressing Repository ${this.url}`);
                            }
                        });
                    } else {
                        spinner.fail(`Failed to Compressing Repository ${this.url}`);
                    }
                });
            }
        }
    }

    compressSync() {
        if (!this.invalidURL) {
            if (this.isExists()) {
                spawnSync('zip', ['-r', this.getArchiveLocation(), this.getRepositorySaveLocation()]);
            }
        }
    }

    getRepositoryUpdate() {
        if (!this.invalidURL) {
            if (this.isExists()) {
                const commandExecution = spawn('git', ['pull'], {
                    shell: true,
                    cwd: this.getRepositorySaveLocation(),
                });
                const spinner = ora(`Getting Update Repository${this.url}\n`).start();
                commandExecution.on('close', (code: any) => {
                    if (code == 0) {
                        spinner.succeed(`Repository ${this.url} have been updated`);
                    } else {
                        spinner.fail(`Failed to Get an Update Repository ${this.url}`);
                    }
                });
            }
        }
    }

    getRepositoryUpdateSync() {
        if (!this.invalidURL) {
            if (this.isExists()) {
                spawn('git', ['pull'], {
                    cwd: this.getRepositorySaveLocation(),
                });
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

    deleteConfigFile(): void {
        if (this.isExists()) {
            fs.unlinkSync(this.getConfigFileLocation());
        }
    }

    deleteRepository(): void {
        if (this.getRepositorySaveLocation()) {
            spawnSync('rm', ['-rf', this.getRepositorySaveLocation()], {
                shell: true,
            });
        }
    }

    deleteArchive(): void {
        if (this.isArchiveExist()) {
            fs.unlinkSync(this.getArchiveLocation());
        }
    }

    deleteAll(): void {
        const spinner = ora(`Pleasewait.. Removing ${this.url}\n`).start();
        this.deleteConfigFile();
        this.deleteRepository();
        this.deleteArchive();
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

    async runScript(script: Script) {
        await script.runScript(null, this.getRepositorySaveLocation());
    }

    static getAll(): Git[] {
        const files = recursive(gitStore, ['.gitkeep',]);
        return files.map((x: any) => {
            let dataToml: string = fs.readFileSync(x, 'utf-8');
            let gitModel: GitModel = toml.parse(dataToml);
            return new Git(gitModel, true);
        });
    }
}
