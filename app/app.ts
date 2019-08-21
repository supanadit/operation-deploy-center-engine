// lib/app.ts
'use strict';
import { ShellSecure, ShellSecureModel } from './model/ShellSecure';
import bodyParser = require('body-parser');
import express = require('express');
import { Git, GitModel } from './model/Git';
import { DefaultResponse } from "./model/ResponseObject";
import { Deploy, DeployModel } from "./model/Deploy";

const {Signale} = require('signale');
const chalk = require('chalk');
const CFonts = require('cfonts');
const client = require('scp2');
const ora = require('ora');
// Create a new express application instance
const app: express.Application = express();
const node_ssh = require('node-ssh');
const sshTransfer = new node_ssh();

app.use(bodyParser.json());
app.get('/', function (req, res) {
    res.send('Hello World!');
});

app.get('/test', function (req, res) {
    // This End Point just to use any of action for test you need as developer and see the result on CONSOLE
    res.send('You Just Called Test ?');
});
app.post('/run/deploy', function (req, res) {
    try {
        const deployModel: DeployModel = req.body;
        if (deployModel != null) {
            const deploy: Deploy = new Deploy(deployModel);
            deploy.runDeploy();
        }
        res.send('Deploy');
    } catch (e) {
        console.log('Error : ' + e);
    }
});

app.post('/unzip', function (req, res) {
    try {
        const data = req.body;
        let sshData: ShellSecure | null = ShellSecure.fromConfigFile(data['ssh']);
        if (sshData != null) {
            const gitModel: GitModel = data;
            let git: Git = new Git(gitModel);
            const spinner = ora(`Unzip ${git.url} to ${sshData.host}`).start();
            const password = sshData.password;
            sshTransfer.connect({
                host: sshData.host,
                username: sshData.username,
                port: 22,
                password,
            }).then(function () {
                spinner.text = "Unziping";
                sshTransfer.execCommand(`unzip ${git.getArchiveNameOnly()} -d ${git.getProjectName()}`, {cwd: '/home/'}).then(function (result: { stdout: string; stderr: string; }) {
                    spinner.text = "Success Unziping";
                    console.info(result.stdout);
                    console.info(result.stderr);
                });
                spinner.text = "Deleting ZIP";
                sshTransfer.execCommand(`rm ${git.getArchiveNameOnly()}`, {cwd: '/home/'}).then(function (result: { stdout: string; stderr: string; }) {
                    spinner.succeed("Success Delete ZIP");
                    console.info(result.stdout);
                    console.info(result.stderr);
                });
            })
        }
        res.send('Deploy');
    } catch (e) {
        console.log('Error : ' + e);
    }
});

app.post('/upload/zip', function (req, res) {
    try {
        const data = req.body;
        let ssh: ShellSecure | null = ShellSecure.fromConfigFile(data['ssh']);
        if (ssh != null) {
            const gitModel: GitModel = data;
            let git: Git = new Git(gitModel);
            const spinner = ora(`Uploading ${git.url} to ${ssh.host}`).start();
            client.scp(git.getArchiveLocation(), {
                host: ssh.host,
                username: ssh.username,
                password: ssh.password,
                path: '/'
            }, function (err: any) {
                if (err == null) {
                    spinner.succeed('Upload Success');
                } else {
                    spinner.fail('Upload Failed');
                }
            });
        }
        res.send('Deploy');
    } catch (e) {
        console.log('Error : ' + e);
    }
});

app.post('/ssh/save', function (req, res) {
    let ssh: ShellSecureModel;
    try {
        ssh = req.body;
        const sshAccount: ShellSecure = new ShellSecure(ssh);
        sshAccount.save();
        res.send(DefaultResponse.success("SSH Account have been saved"));
    } catch (e) {
        console.log('Error : ' + e);
    }
});

app.post('/git/clone', function (req, res) {
    let git: GitModel;
    try {
        git = req.body;
        const gitData: Git = new Git(git);
        if (gitData.isInvalidURL()) {
            res.send('Cannot Clone This Repository');
        } else {
            gitData.clone();
            res.send('Cloning Repository');
        }
    } catch (e) {
        console.log('Error : ' + e);
    }
});

app.post('/git/compress', function (req, res) {
    let git: GitModel;
    try {
        git = req.body;
        const gitData: Git = new Git(git);
        if (!gitData.isExists() && !gitData.isRepositotyExist()) {
            res.send('This Repository Does not exist');
        } else {
            gitData.compress();
            res.send('Compressing Repository');
        }
    } catch (e) {
        console.log('Error : ' + e);
    }
});

app.post('/git/remove', function (req, res) {
    let git: GitModel;
    try {
        git = req.body;
        const gitData: Git = new Git(git);
        if (!gitData.isExists() && !gitData.isRepositotyExist()) {
            res.send('This Repository Does not exist');
        } else {
            gitData.deleteAll();
            res.send('Remove Repository');
        }
    } catch (e) {
        console.log('Error : ' + e);
    }
});

CFonts.say('Operation X Engine', {
    font: 'block',
});

console.log('Software :', chalk.rgb(255, 255, 255).dim('Auto Engine'));
console.log('');
console.log('Original Author : Supan Adit Pratama', chalk.rgb(255, 255, 255).underline('<supanadit@gmail.com>'));
console.log('');
console.log('Version :', chalk.hex('#FFFFFF').bgBlue(' 1.0 '));
console.log('');
console.log('Current OS : ', chalk.hex('#FFFFFF').bgRed(' ' + process.platform + ' '));
console.log('');
const processStart = new Signale({interactive: true, scope: 'Starting Server'});
processStart.await('Starting Server');
setTimeout(function () {
    app.listen(3000, function () {
        processStart.success('Engine success started on port 3000');
    });
}, 1000);
