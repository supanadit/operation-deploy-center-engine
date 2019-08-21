import { ShellSecure, ShellSecureModel } from "./ShellSecure";
import { Git, GitModel } from "./Git";

const ora = require('ora');
const node_ssh = require('node-ssh');
const ssh = new node_ssh();
const client = require('scp2');

export interface DeployModel {
    ssh: ShellSecureModel;
    git: GitModel;
    target: string;
}

export class Deploy implements DeployModel {
    target: string;
    git: GitModel;
    ssh: ShellSecureModel;

    constructor(deployModel: DeployModel) {
        this.target = deployModel.target;
        this.git = deployModel.git;
        this.ssh = deployModel.ssh;
    }

    runDeploy() {
        const git: Git = new Git(this.git);
        const autoSSH: ShellSecure | null = ShellSecure.getAutoSSH(this.ssh);
        if (autoSSH != null && this.target != null) {
            const shellSecure: ShellSecure = autoSSH;
            const password = shellSecure.password;
            const target = this.target;
            const spinner = ora(`Compressing ${git.url}`).start();
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
                                    spinner.text = "Deleting ZIP";
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
}
