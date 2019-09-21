import { scriptsStore } from '../../config/setting';
import { Log } from './Log';

const spawn = require('await-spawn');

const fs = require('fs');

const tomlify = require('tomlify-j0.4');
const toml = require('toml');
const ora = require('ora');
const recursive = require('recursive-readdir-synchronous');

export const COMPRESS_THIS: SystemIdentificationCode = {
    code: 'COMPRESS_THIS',
    description: 'The System will Automatically ZIP the Folder and Move to Archive Folder'
};
export const LIST_SYSTEM_IDENTIFICATION_CODE: Array<SystemIdentificationCode> = [
    COMPRESS_THIS,
];

interface SystemIdentificationCode {
    code: string;
    description: string;
}

export interface ScriptInterface {
    name: string;
    dependency?: Array<string>;
    command: Array<CommandInterface>;
    description: string;
}

export interface CommandInterface {
    command: string;
    description?: string;
    directory?: Array<string>;
    system_identification?: SystemIdentificationCode;
}

export class Script implements ScriptInterface {
    name: string;
    dependency?: Array<string>;
    command: Array<CommandInterface>;
    description: string;

    constructor(script: ScriptInterface) {
        this.command = script.command;
        this.dependency = script.dependency;
        this.name = script.name;
        this.description = script.description;
    }

    getLocationFile(): string {
        return scriptsStore.concat('/').concat(this.name).concat('.toml');
    }

    isExist(): boolean {
        return fs.existsSync(this.getLocationFile());
    }

    saveScriptFile(): boolean {
        let result: boolean = false;
        try {
            let git: ScriptInterface = this;
            const toml = tomlify.toToml(git, {space: 2});
            fs.writeFileSync(this.getLocationFile(), toml);
            result = true;
        } catch (error) {
            console.log('Error Create Script ', this.name, 'With Error', error);
        }
        return result;
    }

    async runScript(spinner = null, parentDirectory = '', log: Log | null = null) {
        const name = this.name;
        const command = this.command;
        const main = async () => {
            const spinnerData = (spinner == null) ? ora(`Running Script ${name}`).start() : spinner;
            if (log != null) {
                log.addNoProcessOperationLog('Running Script ', name);
            }
            const timeout = function (ms: number) {
                return new Promise(resolve => setTimeout(resolve, ms));
            };
            const timeoutTime = 1500;
            let totalOperation = command.length;
            let countedOperation = 0;
            let countedError = 0;
            let countedSuccess = 0;
            for (let operation of command) {
                countedOperation += 1;
                const commandSplit = operation.command.split(' ');
                const firstAction = commandSplit[0];
                const messageIndicator = (operation.description != null) ? operation.description : 'Try '.concat(firstAction);
                spinnerData.color = 'cyan';
                spinnerData.text = messageIndicator.concat(' ').concat(`${countedOperation} of ${totalOperation}`);
                if (log != null) {
                    log.addNoProcessOperationLog('Running Script ', messageIndicator.concat(' ').concat(`${countedOperation} of ${totalOperation}`));
                }
                await timeout(timeoutTime);
                let paramAction: Array<string> = [];
                if (commandSplit.length >= 1) {
                    paramAction = commandSplit.slice(1);
                }
                let commandExecution: any;
                let runInDirectory: string | null = null;
                if (parentDirectory != '') {
                    if (operation.directory == null) {
                        runInDirectory = parentDirectory;
                    } else {
                        runInDirectory = parentDirectory.concat('/').concat(operation.directory.join('/'));
                    }
                }

                try {
                    if (runInDirectory != null) {
                        commandExecution = await spawn(firstAction, paramAction, {
                            shell: true,
                            cwd: runInDirectory,
                        });
                    } else {
                        commandExecution = await spawn(firstAction, paramAction, {
                            shell: true,
                        });
                    }
                    countedSuccess += 1;
                    spinnerData.color = 'green';
                    spinnerData.text = 'Success '.concat((operation.description != null) ? operation.description : firstAction);
                    if (log != null) {
                        log.addNoProcessOperationLog('Running Script ', 'Success '.concat((operation.description != null) ? operation.description : firstAction));
                    }
                    await timeout(timeoutTime);
                } catch (error) {
                    countedError += 1;
                    spinnerData.color = 'red';
                    spinnerData.text = 'Failed '.concat((operation.description != null) ? operation.description : firstAction);
                    if (log != null) {
                        log.addNoProcessOperationLog('Running Script ', 'Failed '.concat((operation.description != null) ? operation.description : firstAction));
                    }
                    await timeout(timeoutTime);
                }
            }
            const finnishMessage = `Finish run script ${name} with ${countedSuccess} success, ${countedError} error of Total ${totalOperation} operation`;
            if (spinner == null) {
                spinnerData.color = 'green';
                spinnerData.succeed(finnishMessage);
            } else {
                spinnerData.text = finnishMessage;
            }
            if (log != null) {
                log.addNoProcessOperationLog(`Script Finish ${name}`, finnishMessage);
            }
        };
        await main();
    }

    static loadFile(name: string): Script | null {
        const fileName = scriptsStore.concat('/').concat(name).concat('.toml');
        let script: Script | null = null;
        if (fs.existsSync(fileName)) {
            let dataToml: string = fs.readFileSync(fileName, 'utf-8');
            let scriptModel: ScriptInterface = toml.parse(dataToml);
            script = new Script(scriptModel);
        }
        return script;
    }

    static getAll(): Script[] {
        const files = recursive(scriptsStore, ['.gitkeep',]);
        return files.map((x: any) => {
            let dataToml: string = fs.readFileSync(x, 'utf-8');
            let scriptInterface: ScriptInterface = toml.parse(dataToml);
            return new Script(scriptInterface);
        });
    }
}
