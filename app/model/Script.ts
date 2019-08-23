import { scriptsStore } from "../../config/setting";
import { spawnSync } from "child_process";

const fs = require('fs');

const tomlify = require('tomlify-j0.4');
const toml = require('toml');
const ora = require('ora');

export const COMPRESS_THIS: SystemIdentificationCode = {
    code: "COMPRESS_THIS",
    description: "The System will Automatically ZIP the Folder and Move to Archive Folder"
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

    constructor(script: ScriptInterface) {
        this.command = script.command;
        this.dependency = script.dependency;
        this.name = script.name;
    }

    getLocationFile(): string {
        return scriptsStore.concat('/').concat(this.name).concat(".toml");
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
        } catch (error) {
            console.log('Error Create Script ', this.name, 'With Error', error);
        }
        return result;
    }

    runScript(spinner = null, parentDirectory = "") {
        const spinnerData = (spinner == null) ? ora(`Running Script ${this.name}`).start() : spinner;
        for (let operation of this.command) {
            // Skip For Now
            // let valid: boolean = false;
            // if (operation.system_identification != null) {
            //     valid = LIST_SYSTEM_IDENTIFICATION_CODE.some((x) => x == operation.system_identification);
            // }
            const commandSplit = operation.command.split(" ");
            const firstAction = commandSplit[0];
            spinnerData.text = (operation.description != null) ? operation.description : "Try ".concat(firstAction);
            let paramAction: Array<string> = [];
            if (commandSplit.length >= 1) {
                paramAction = commandSplit.slice(1);
            }
            let commandExecution: any;
            let runInDirectory: string | null = null;
            if (parentDirectory != "") {
                if (operation.directory == null) {
                    runInDirectory = parentDirectory;
                } else {
                    runInDirectory = parentDirectory.concat("/").concat(operation.directory.join("/"))
                }
            }
            if (runInDirectory != null) {
                commandExecution = spawnSync(firstAction, paramAction, {
                    shell: true,
                    cwd: runInDirectory,
                });
            } else {
                commandExecution = spawnSync(firstAction, paramAction, {
                    shell: true,
                });
            }
            const error = commandExecution.error;
            if (typeof error == "undefined") {
                spinnerData.text = "Success ".concat((operation.description != null) ? operation.description : firstAction);
            } else {
                spinnerData.text = "Failed ".concat((operation.description != null) ? operation.description : firstAction);
            }
        }
        spinnerData.succeed("Finish");
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
}
