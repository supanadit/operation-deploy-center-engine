import { ShellSecure, ShellSecureModel } from './ShellSecure';
import { Git, GitModel } from './Git';
import { Script, ScriptInterface } from './Script';
import { Log } from './Log';
import { deployHistory, gitStore } from '../../config/setting';

const ora = require('ora');
const node_ssh = require('node-ssh');
const ssh = new node_ssh();
const client = require('scp2');
export const fs = require('fs');
export const moment = require('moment');
export const tomlify = require('tomlify-j0.4');
const recursive = require('recursive-readdir-synchronous');
const toml = require('toml');

export interface DeployModel {
    ssh: ShellSecureModel;
    git: GitModel;
    target: string;
    targetCompress: string;
    scriptLocal?: ScriptInterface;
    scriptRemote?: ScriptInterface;
}

export interface DeployHistoryModel {
    ssh: {
        host: string;
    };
    git: {
        url: string;
    }
    target: string;
    targetCompress: string;
}

export class Deploy implements DeployModel {
    target: string;
    targetCompress: string;
    git: GitModel;
    ssh: ShellSecureModel;
    scriptLocal?: ScriptInterface;
    scriptRemote?: ScriptInterface;

    constructor(deployModel: DeployModel) {
        this.target = deployModel.target;
        this.targetCompress = deployModel.targetCompress;
        this.git = deployModel.git;
        this.ssh = deployModel.ssh;
        this.scriptLocal = deployModel.scriptLocal;
        this.scriptRemote = deployModel.scriptRemote;
    }

    async scriptDeploy(log: Log | null = null) {
        const git: Git = new Git(this.git);
        const autoSSH: ShellSecure | null = ShellSecure.getAutoSSH(this.ssh);
        if (autoSSH != null && this.target != null) {
            const shellSecure: ShellSecure = autoSSH;
            const password = shellSecure.password;
            const target = this.target;
            const spinner = ora(`Getting Update ${git.url}`).start();
            const deploy = this;
            if (log != null) {
                log.addNoProcessOperationLog('Getting Update', 'Updating Repository');
            }
            git.getRepositoryUpdateSync();
            spinner.text = `Deleting Archive ${git.url}`;
            if (log != null) {
                log.addNoProcessOperationLog('Delete Archive', 'Delete old archive if exist');
            }
            if (this.scriptLocal != null) {
                const scriptLocalData: Script = new Script(this.scriptLocal);
                await scriptLocalData.runScript(spinner, git.getRepositorySaveLocation(), log);
            }
            git.deleteArchive();
            spinner.text = `Comressing ${git.url}`;
            if (log != null) {
                log.addNoProcessOperationLog('Compressing', 'Compressing Repository');
            }
            git.compressSync(this.targetCompress.split('/'));
            spinner.text = `Deploy ${git.url} to Server ${shellSecure.host} with Folder ${this.target}`;
            if (log != null) {
                log.addNoProcessOperationLog('Preparing', 'Prepare to Deploy');
            }
            // setTimeout(function () {
            //     spinner.text = `Uploading ${git.url} to ${shellSecure.host}`;
            //     if (log != null) {
            //         log.addNoProcessOperationLog('Connecting', 'Start Connecting To Server');
            //     }
            //     ssh.connect({
            //         host: shellSecure.host,
            //         username: shellSecure.username,
            //         port: shellSecure.port,
            //         password,
            //         tryKeyboard: false,
            //     }).then(function () {
            //         spinner.text = `Cleaning Target Folder`;
            //         if (log != null) {
            //             log.addNoProcessOperationLog('Clean', 'Cleaning Target Folder');
            //         }
            //         ssh.execCommand(`rm -rf *`, {cwd: target}).then(function (result: { stdout: string; stderr: string; }) {
            //             if (log != null) {
            //                 log.addNoProcessOperationLog('Uploading', 'Upload Archive');
            //             }
            //             client.scp(git.getArchiveLocation(), {
            //                 host: shellSecure.host,
            //                 username: shellSecure.username,
            //                 password: shellSecure.password,
            //                 path: target,
            //             }, function (err: any) {
            //                 if (err == null) {
            //                     spinner.text = `Unzip`;
            //                     if (log != null) {
            //                         log.addNoProcessOperationLog('Unzip', 'Unzip Repository');
            //                     }
            //                     ssh.execCommand(`unzip ${git.getArchiveNameOnly()}`, {cwd: target}).then(function (result: { stdout: string; stderr: string; }) {
            //                         spinner.text = 'Deleting ZIP';
            //                         if (log != null) {
            //                             log.addNoProcessOperationLog('Remove Archive', 'Deleting Archive');
            //                         }
            //                         ssh.execCommand(`rm ${git.getArchiveNameOnly()}`, {cwd: target}).then(function (result: { stdout: string; stderr: string; }) {
            //                             spinner.succeed(`Success Deploy ${git.url} to Server ${shellSecure.host}`);
            //                             if (log != null) {
            //                                 deploy.save();
            //                                 log.addNoProcessOperationLog('Success', 'Finish Deploying');
            //                                 log.stop();
            //                             }
            //                         }).catch((error: any) => {
            //                             if (log != null) {
            //                                 log.addNoProcessOperationLog('Failed', 'Failed Cleaning Archive');
            //                                 log.stop();
            //                             }
            //                         });
            //                     }).catch((error: any) => {
            //                         if (log != null) {
            //                             log.addNoProcessOperationLog('Cannot Extract', 'Failed to Extract archive');
            //                             log.stop();
            //                         }
            //                     });
            //                 } else {
            //                     spinner.fail('Upload Failed');
            //                     if (log != null) {
            //                         log.addNoProcessOperationLog('Cannot Upload', 'Cannot upload to selected target');
            //                         log.stop();
            //                     }
            //                 }
            //             });
            //         });
            //     }).catch((error: any) => {
            //         if (log != null) {
            //             log.addNoProcessOperationLog('Failed', 'Server Auth Error', 'error');
            //             log.stop();
            //         }
            //     });
            // }, 1500);
            spinner.succeed('Finnish');
            if (log != null) {
                log.addNoProcessOperationLog('Test Finish', 'Finish');
                log.stop();
            }
        } else {
            if (log != null) {
                log.addNoProcessOperationLog('Failed', 'Unknown Error', 'error');
                log.stop();
            }
        }
    }

    standardDeploy(log: Log | null = null) {
        const git: Git = new Git(this.git);
        const autoSSH: ShellSecure | null = ShellSecure.getAutoSSH(this.ssh);
        if (autoSSH != null && this.target != null) {
            const shellSecure: ShellSecure = autoSSH;
            const password = shellSecure.password;
            const target = this.target;
            const spinner = ora(`Getting Update ${git.url}`).start();
            const deploy = this;
            if (log != null) {
                log.addNoProcessOperationLog('Getting Update', 'Updating Repository');
            }
            git.getRepositoryUpdateSync();
            spinner.text = `Deleting Archive ${git.url}`;
            if (log != null) {
                log.addNoProcessOperationLog('Delete Archive', 'Delete old archive if exist');
            }
            git.deleteArchive();
            spinner.text = `Comressing ${git.url}`;
            if (log != null) {
                log.addNoProcessOperationLog('Compressing', 'Compressing Repository');
            }
            git.compressSync(this.targetCompress.split('/'));
            spinner.text = `Deploy ${git.url} to Server ${shellSecure.host} with Folder ${this.target}`;
            if (log != null) {
                log.addNoProcessOperationLog('Preparing', 'Prepare to Deploy');
            }
            setTimeout(function () {
                spinner.text = `Uploading ${git.url} to ${shellSecure.host}`;
                if (log != null) {
                    log.addNoProcessOperationLog('Connecting', 'Start Connecting To Server');
                }
                ssh.connect({
                    host: shellSecure.host,
                    username: shellSecure.username,
                    port: shellSecure.port,
                    password,
                    tryKeyboard: false,
                }).then(function () {
                    spinner.text = `Cleaning Target Folder`;
                    if (log != null) {
                        log.addNoProcessOperationLog('Clean', 'Cleaning Target Folder');
                    }
                    ssh.execCommand(`rm -rf *`, {cwd: target}).then(function (result: { stdout: string; stderr: string; }) {
                        if (log != null) {
                            log.addNoProcessOperationLog('Uploading', 'Upload Archive');
                        }
                        client.scp(git.getArchiveLocation(), {
                            host: shellSecure.host,
                            username: shellSecure.username,
                            password: shellSecure.password,
                            path: target,
                        }, function (err: any) {
                            if (err == null) {
                                spinner.text = `Unzip`;
                                if (log != null) {
                                    log.addNoProcessOperationLog('Unzip', 'Unzip Repository');
                                }
                                ssh.execCommand(`unzip ${git.getArchiveNameOnly()}`, {cwd: target}).then(function (result: { stdout: string; stderr: string; }) {
                                    spinner.text = 'Deleting ZIP';
                                    if (log != null) {
                                        log.addNoProcessOperationLog('Remove Archive', 'Deleting Archive');
                                    }
                                    ssh.execCommand(`rm ${git.getArchiveNameOnly()}`, {cwd: target}).then(function (result: { stdout: string; stderr: string; }) {
                                        spinner.succeed(`Success Deploy ${git.url} to Server ${shellSecure.host}`);
                                        if (log != null) {
                                            deploy.save();
                                            log.addNoProcessOperationLog('Success', 'Finish Deploying');
                                            log.stop();
                                        }
                                    }).catch((error: any) => {
                                        if (log != null) {
                                            log.addNoProcessOperationLog('Failed', 'Failed Cleaning Archive');
                                            log.stop();
                                        }
                                    });
                                }).catch((error: any) => {
                                    if (log != null) {
                                        log.addNoProcessOperationLog('Cannot Extract', 'Failed to Extract archive');
                                        log.stop();
                                    }
                                });
                            } else {
                                spinner.fail('Upload Failed');
                                if (log != null) {
                                    log.addNoProcessOperationLog('Cannot Upload', 'Cannot upload to selected target');
                                    log.stop();
                                }
                            }
                        });
                    });
                }).catch((error: any) => {
                    if (log != null) {
                        log.addNoProcessOperationLog('Failed', 'Server Auth Error', 'error');
                        log.stop();
                    }
                });
            }, 1500);
        } else {
            if (log != null) {
                log.addNoProcessOperationLog('Failed', 'Unknown Error', 'error');
                log.stop();
            }
        }
    }

    save() {
        const date = moment().format('YYYYMMDDHHmmss');
        const fileName = date.concat('-').concat(this.ssh.host).concat('.toml');
        const location = deployHistory.concat('/').concat(fileName);
        const savedContent = {
            ssh: {
                host: this.ssh.host,
            },
            git: {
                url: this.git.url,
            },
            target: this.target,
            targetCompress: this.targetCompress,
        };
        const toml = tomlify.toToml(savedContent, {space: 2});
        fs.writeFileSync(location, toml);
    }

    static getAll(): Deploy[] {
        const files = recursive(deployHistory, ['.gitkeep',]);
        return files.map((x: any) => {
            let dataToml: string = fs.readFileSync(x, 'utf-8');
            let deployHistoryModel: DeployHistoryModel = toml.parse(dataToml);
            const deployModel: DeployModel = {
                ssh: {
                    host: deployHistoryModel.ssh.host,
                },
                git: {
                    url: deployHistoryModel.git.url,
                },
                target: deployHistoryModel.target,
                targetCompress: deployHistoryModel.targetCompress,
            };
            return new Deploy(deployModel);
        });
    }
}
