import { ShellSecure, ShellSecureModel } from './ShellSecure';
import { Git, GitModel } from './Git';
import { ScriptInterface } from './Script';
import { Log } from './Log';

const ora = require('ora');
const node_ssh = require('node-ssh');
const ssh = new node_ssh();
const client = require('scp2');

export interface DeployModel {
    ssh: ShellSecureModel;
    git: GitModel;
    target: string;
    targetCompress: string;
    scriptLocal?: ScriptInterface;
    scriptRemote?: ScriptInterface;
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

    runDeploy() {
        const git: Git = new Git(this.git);
        const autoSSH: ShellSecure | null = ShellSecure.getAutoSSH(this.ssh);
        if (autoSSH != null && this.target != null) {
            const shellSecure: ShellSecure = autoSSH;
            const password = shellSecure.password;
            const target = this.target;
            const spinner = ora(`Getting Update ${git.url}`).start();
            git.getRepositoryUpdateSync();
            spinner.text = `Deleting Archive ${git.url}`;
            git.deleteArchive();
            spinner.text = `Comressing ${git.url}`;
            git.compressSync();
            spinner.text = `Deploy ${git.url} to Server ${shellSecure.host} with Folder ${this.target}`;
            setTimeout(function () {
                spinner.text = `Uploading ${git.url} to ${shellSecure.host}`;
                ssh.connect({
                    host: shellSecure.host,
                    username: shellSecure.username,
                    port: shellSecure.port,
                    password,
                    tryKeyboard: false,
                }).then(function () {
                    spinner.text = `Cleaning Target Folder`;
                    ssh.execCommand(`rm -rf *`, {cwd: target}).then(function (result: { stdout: string; stderr: string; }) {
                        client.scp(git.getArchiveLocation(), {
                            host: shellSecure.host,
                            username: shellSecure.username,
                            password: shellSecure.password,
                            path: target,
                        }, function (err: any) {
                            if (err == null) {
                                spinner.text = `Unzip`;
                                ssh.execCommand(`unzip ${git.getArchiveNameOnly()}`, {cwd: target}).then(function (result: { stdout: string; stderr: string; }) {
                                    spinner.text = 'Deleting ZIP';
                                    ssh.execCommand(`rm ${git.getArchiveNameOnly()}`, {cwd: target}).then(function (result: { stdout: string; stderr: string; }) {
                                        spinner.succeed(`Success Deploy ${git.url} to Server ${shellSecure.host}`);
                                    });
                                });
                            } else {
                                spinner.fail('Upload Failed');
                            }
                        });
                    });
                });
            }, 1500);
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
            git.compressSync();
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
}
