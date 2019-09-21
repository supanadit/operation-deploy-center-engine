// lib/app.ts
'use strict';
import { ShellSecure, ShellSecureModel } from './model/ShellSecure';
import { Git, GitModel } from './model/Git';
import { DefaultResponse } from './model/ResponseObject';
import { Deploy, DeployModel } from './model/Deploy';
import { SystemAppChecker } from './model/System';
import { Script, ScriptInterface } from './model/Script';
import { Log } from './model/Log';
import bodyParser = require('body-parser');
import express = require('express');
import { Socket } from './helper/Socket';

const {Signale} = require('signale');
const chalk = require('chalk');
const CFonts = require('cfonts');
const client = require('scp2');
const ora = require('ora');
// Create a new express application instance
const app: express.Application = express();
app.use(function (req: any, res: any, next: any) {
    res.header('Access-Control-Allow-Origin', req.headers.origin); // update to match the domain you will make the request from
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Credentials', 'true');
    next();
});
const node_ssh = require('node-ssh');
const sshTransfer = new node_ssh();
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
    handlePreflightRequest: (req: any, res: any) => {
        const headers: any = {
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Allow-Origin': req.headers.origin, //or the specific origin you want to give access to,
            'Access-Control-Allow-Credentials': true
        };
        res.writeHead(200, headers);
        res.end();
    }
});
const socket: Socket = new Socket(io);
// Hello World
app.use(bodyParser.json());
app.get('/', function (req, res) {
    res.send('Hello World!');
});

app.get('/test', function (req, res) {
    // This End Point just to use any of action for test you need as developer and see the result on CONSOLE
    res.send('You Just Called Test ?');
});

app.get('/deploy/history', function (req, res) {
    try {
        const deployHistory: Deploy[] = Deploy.getAll();
        res.send(DefaultResponse.success<Deploy[]>('Success', {
            data: deployHistory,
        }));
    } catch (e) {
        console.log('Error : ' + e);
    }
});

app.post('/script/deploy', function (req, res) {
    const operation: Log = new Log('Starting Script Deploy', `Script Deploy`, socket);
    try {
        const deployModel: DeployModel = req.body;
        if (deployModel != null) {
            const deploy: Deploy = new Deploy(deployModel);
            deploy.scriptDeploy(operation);
        }
        res.send('Deploy');
    } catch (e) {
        console.log('Error : ' + e);
    }
});

app.post('/standard/deploy', function (req, res) {
    const operation: Log = new Log('Starting Standard Deploy', `Standard Deploy`, socket);
    try {
        const deployModel: DeployModel = req.body;
        if (deployModel != null) {
            const deploy: Deploy = new Deploy(deployModel);
            deploy.standardDeploy(operation);
        }
        res.send('Deploy');
    } catch (e) {
        operation.addNoProcessOperationLog('Failed', 'Failed to Deploy', 'error');
        operation.stop();
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
                spinner.text = 'Unziping';
                sshTransfer.execCommand(`unzip ${git.getArchiveNameOnly()} -d ${git.getProjectName()}`, {cwd: '/home/'}).then(function (result: { stdout: string; stderr: string; }) {
                    spinner.text = 'Success Unziping';
                    console.info(result.stdout);
                    console.info(result.stderr);
                });
                spinner.text = 'Deleting ZIP';
                sshTransfer.execCommand(`rm ${git.getArchiveNameOnly()}`, {cwd: '/home/'}).then(function (result: { stdout: string; stderr: string; }) {
                    spinner.succeed('Success Delete ZIP');
                    console.info(result.stdout);
                    console.info(result.stderr);
                });
            });
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
        const operation: Log = new Log('Requesting SSH Save', `Saving ${ssh.host}`);
        const sshAccount: ShellSecure = new ShellSecure(ssh);
        sshAccount.save();
        res.send(DefaultResponse.success('SSH Account have been saved'));
    } catch (e) {
        res.send(DefaultResponse.error('Failed Save SSH Account'));
    }
});


app.post('/ssh/remove', function (req, res) {
    let ssh: ShellSecureModel;
    try {
        ssh = req.body;
        const operation: Log = new Log('Requesting SSH Remove', `Deleting ${ssh.host}`);
        const sshAccount: ShellSecure = new ShellSecure(ssh);
        sshAccount.deleteConfigFile(operation);
        res.send(DefaultResponse.success('SSH Account have been saved'));
    } catch (e) {
        res.send(DefaultResponse.error('Failed Save SSH Account'));
    }
});

app.post('/ssh/check/directory', function (req, res) {
    let ssh: ShellSecureModel;
    const spinner = ora(`Preparing to Check Directory`).start();
    try {
        ssh = req.body;
        const directory = req.body['directory'];
        const sshAccount: ShellSecure = new ShellSecure(ssh);
        spinner.text = `Check Directory ${directory} in ${ssh.host}`;
        sshAccount.checkDirectory(directory).then((ssh) => {
            spinner.text = 'Getting Directory';
            ssh.execCommand(`ls ${directory}`, {cwd: '/'}).then(function (result: { stdout: string; stderr: string; }) {
                if (result.stderr == '') {
                    spinner.succeed('Success Getting Directory List');
                    res.send(DefaultResponse.success<Array<string>>('Success Check SSH Directory', {
                        data: result.stdout.split('\n')
                    }));
                } else {
                    spinner.fail(`${directory} not found in ${ssh.host}`);
                    res.send(DefaultResponse.error('Directory Not Found'));
                }
            }).catch((error: any) => {
                spinner.fail(`Failed Authenticate`);
                res.send(DefaultResponse.error('Failed Authenticate'));
            });
        }).catch((error) => {
            spinner.fail(`Failed Authenticate`);
            res.send(DefaultResponse.error('Failed Authenticate'));
        });
    } catch (e) {
        spinner.fail(`Something went wrong while checking Directory`);
        res.send(DefaultResponse.error('Error while Checking Directory'));
    }
});

app.post('/git/check/directory', function (req, res) {
    let git: GitModel;
    const spinner = ora(`Preparing to Check Directory`).start();
    try {
        git = req.body;
        const directory = req.body['directory'];
        const gitData: Git = new Git(git, true);
        spinner.text = `Check Directory ${directory} in Repository ${git.url}`;
        if (!gitData.isExists()) {
            const response = `Repository Does not exist`;
            spinner.fail(response);
            res.send(DefaultResponse.error(response));
        } else if (!gitData.isRepositotyExist()) {
            const response = `Repository need tobe cloned`;
            spinner.fail(response);
            res.send(DefaultResponse.error(response));
        } else {
            const checkDirectory = gitData.getListDirectory(directory);
            if (checkDirectory == null) {
                const response = `Directory ${directory} not Found`;
                spinner.fail(response);
                res.send(DefaultResponse.error(response));
            } else {
                const response = `Success Listing Repository Directory`;
                spinner.succeed(response);
                res.send(DefaultResponse.success<Array<string>>(response, {
                    data: checkDirectory
                }));
            }
        }
    } catch (e) {
        spinner.fail(`Something went wrong while checking Directory`);
        res.send(DefaultResponse.error('Error while Checking Directory'));
    }
});

app.post('/git/clone', function (req, res) {
    let git: GitModel;
    try {
        git = req.body;
        const gitData: Git = new Git(git);
        const operation: Log = new Log('Requesting Git Clone', `Git Clone ${git.url}`, socket);
        if (gitData.isInvalidURL()) {
            operation.stop();
            res.send('Cannot Clone This Repository');
        } else {
            gitData.clone(operation);
            res.send('Cloning Repository');
        }
    } catch (e) {
        console.log(e);
        res.send(DefaultResponse.error<any>('Some Error'));
    }
});

app.get('/git', function (req, res) {
    try {
        const gitData: Git[] = Git.getAll();
        res.send(DefaultResponse.success<Git[]>('Success Get All Git', {
            data: gitData
        }));
    } catch (e) {
        console.log('Error : ' + e);
    }
});

app.post('/git/save', function (req, res) {
    let git: GitModel;
    try {
        git = req.body;
        const gitData: Git = new Git(git);
        if (gitData.isInvalidURL()) {
            res.send(DefaultResponse.error('Failed to Save this Repository'));
        } else {
            gitData.createConfigFile();
            res.send(DefaultResponse.success('Success Save This Repository'));
        }
    } catch (e) {
        res.send(DefaultResponse.error('Error to Save Repository'));
    }
});

app.post('/git/compress', function (req, res) {
    let git: GitModel;
    try {
        git = req.body;
        const gitData: Git = new Git(git);
        const operation: Log = new Log('Compressing Repository', `Compressing ${git.url}`, socket);
        if (!gitData.isExists() && !gitData.isRepositotyExist()) {
            operation.addNoProcessOperationLog('Failed Remove Repository', 'This Repository Does not exist');
            operation.stop();
            res.send('This Repository Does not exist');
        } else {
            gitData.compress([], operation);
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
        const gitData: Git = new Git(git, true);
        const operation: Log = new Log('Remove Repository', `Remove Repository ${git.url}`, socket);
        if (!gitData.isExists() && !gitData.isRepositotyExist()) {
            operation.addNoProcessOperationLog('Failed Remove Repository', 'This Repository Does not exist');
            operation.stop();
            res.send('This Repository Does not exist');
        } else {
            gitData.deleteAll(operation);
            res.send('Remove Repository');
        }
    } catch (e) {
        res.send(DefaultResponse.error('Some Error while Deleting Repository'));
        console.log('Error : ' + e);
    }
});

app.post('/git/update', function (req, res) {
    let git: GitModel;
    try {
        git = req.body;
        const gitData: Git = new Git(git);
        const operation: Log = new Log('Update Repository', `Start Updating Repository ${git.url}`, socket);
        if (!gitData.isExists() && !gitData.isRepositotyExist()) {
            operation.addNoProcessOperationLog('Failed Update Repository', 'This Repository Does not exist');
            operation.stop();
            res.send('This Repository Does not exist');
        } else {
            gitData.getRepositoryUpdate(operation);
            res.send('Getting Update');
        }
    } catch (e) {
        console.log('Error : ' + e);
    }
});

app.post('/git/script', function (req, res) {
    let git: GitModel;
    let script: string;
    try {
        git = req.body['git'];
        script = req.body['script'];
        const gitData: Git = new Git(git);
        if (!gitData.isExists() && !gitData.isRepositotyExist()) {
            res.send('This Repository Does not exist');
        } else {
            const scriptFile = Script.loadFile(script);
            if (scriptFile == null) {
                res.send(`${script} is not found`);
            } else {
                gitData.runScript(scriptFile);
                res.send('Run Script');
            }
        }
    } catch (e) {
        console.log('Error : ' + e);
    }
});

app.get('/ssh', function (req, res) {
    const ssh: ShellSecure[] = ShellSecure.getAllShellSecure();
    res.send(DefaultResponse.success<ShellSecure[]>('Success get all SSH', {
        data: ssh
    }));
});

app.get('/operation', function (req, res) {
    try {
        const operationData: Log[] = Log.getListAllOperation();
        res.send(DefaultResponse.success<Log[]>('Success Get All Operation', {
            data: operationData
        }));
    } catch (e) {
        console.log('Error : ' + e);
        res.send(DefaultResponse.error('Some Error'));
    }
});

app.get('/script', function (req, res) {
    try {
        const scripts: Script[] = Script.getAll();
        res.send(DefaultResponse.success<Script[]>('Success Get All Operation', {
            data: scripts
        }));
    } catch (e) {
        console.log('Error : ' + e);
    }
});

app.post('/script/save', function (req, res) {
    let script: ScriptInterface;
    const spinner = ora(`Saving Script`).start();
    try {
        script = req.body;
        const scriptData = new Script(script);
        const saving = scriptData.saveScriptFile();
        if (saving) {
            spinner.succeed(`Save File Script ${script.name} Success`);
        } else {
            spinner.fail(`Failed to Save Script ${script.name}`);
        }
        res.send(DefaultResponse.success<ScriptInterface>('Success', {
            data: script
        }));
    } catch (e) {
        console.log('Error : ' + e);
        spinner.fail(`Error while saving script`);
        res.send(DefaultResponse.error('Some Error'));
    }
});

CFonts.say('Operation X Engine', {
    font: 'block',
});

console.log('Software :', chalk.rgb(255, 255, 255).dim('Auto Engine'));
console.log('');
console.log('Original Author : Supan Adit Pratama', chalk.rgb(255, 255, 255).underline('<email@supanadit.com>'));
console.log('');
console.log('Version :', chalk.hex('#FFFFFF').bgBlue(' 1.0 '));
console.log('');
console.log('Current OS : ', chalk.hex('#FFFFFF').bgRed(' ' + process.platform + ' '));
console.log('');
const processStart = new Signale({interactive: true, scope: 'Engine'});
processStart.await('Starting Server');
setTimeout(function () {
    processStart.await('Checking System');
    const sshCheck: SystemAppChecker = new SystemAppChecker('ssh', processStart);
    const gitCheck: SystemAppChecker = new SystemAppChecker('git', processStart);
    const zipCheck: SystemAppChecker = new SystemAppChecker('zip', processStart);
    const unzipCheck: SystemAppChecker = new SystemAppChecker('unzip', processStart);
    const listSystemChecker: SystemAppChecker[] = [
        sshCheck,
        gitCheck,
        zipCheck,
        unzipCheck,
    ];
    let errorListSystemChecker: SystemAppChecker[] = [];
    for (let x of listSystemChecker) {
        x.checkSync();
        if (!x.isValid()) {
            errorListSystemChecker.push(x);
        }
    }
    if (errorListSystemChecker.length == 0) {
        server.listen(3000, function () {
            processStart.success('Engine success started on port 3000');
        });
    } else {
        processStart.error('Failed to start Engine');
    }
    errorListSystemChecker.forEach((x: SystemAppChecker) => {
        console.info(x.getMessage());
    });
}, 1000);
