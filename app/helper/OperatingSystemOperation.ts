import {spawnSync, spawn, exec} from "child_process";

const ora = require('ora');

export class OperatingSystemOperation {
    private static knownOperatingSystem: OperatingSystem[] = [
        {name: "Windows", short_name: "win32", shell_path: "cmd.exe", args: "/c"},
        {name: "Linux", short_name: "linux", shell_path: "", args: ""},
    ];

    constructor() {
    }

    public executeCommand(command: String, async: boolean = true) {
        const currentOs: OperatingSystem = OperatingSystemOperation.checkOperatingSystem();
        const commandRoot = (currentOs.shell_path == "") ? command : currentOs.shell_path;
        const listReceivedCommand: String[] = command.split(" ");
        const listArgs: String[] = currentOs.args.split(" ");
        const listExecutioner = (currentOs.args == "") ? listReceivedCommand : listArgs.concat(listReceivedCommand);
        let commandExecution;
        if (async) {
            // @ts-ignore
            commandExecution = spawn(commandRoot, listExecutioner, {
                shell: true
            });
        } else {
            // @ts-ignore
            commandExecution = spawnSync(commandRoot, listExecutioner);
        }
        const spinner = ora('Pleasewait.. Clonning repository in progress \n').start();
        commandExecution.stdout.on('data', (data: any) => console.log(`stdout: ${data.toString()}`));
        commandExecution.stderr.on('data', (data: any) => {
            // console.log(`Stderr : ${data.toString()}`);
        });
        commandExecution.on('close', (code: any) => {
            if(code == 0){
                spinner.succeed("Git Clone is succeed");
            }else{
                spinner.fail("Git Clone is failed");
            }
        });
    }

    public static isAllowedOperatingSystem(operatingSystem: String): boolean {
        // @ts-ignore
        const indexNumber = this.findOperatingSystem(operatingSystem);
        return (indexNumber >= 0);
    }

    public static checkIsAllowedOperatingSystem(): boolean {
        // @ts-ignore
        const indexNumber = this.findOperatingSystem(process.platform)
        return (indexNumber >= 0);
    }

    public static checkOperatingSystem(): OperatingSystem {
        // @ts-ignore
        const indexNumber = this.findOperatingSystem(process.platform);
        const operatingSystem: OperatingSystem = this.knownOperatingSystem[indexNumber];
        return operatingSystem;
    }

    private static findOperatingSystem(operatingSystem: String) {
        const arrayOperatingSystem: OperatingSystem[] = this.knownOperatingSystem;
        let indexNumber: number;
        indexNumber = 0;
        for (const x of arrayOperatingSystem) {
            if (x.short_name == operatingSystem) {
                return indexNumber;
            }
            indexNumber += 1;
        }
        return -1;

    }
}

export interface OperatingSystem {
    name: String;
    short_name: String;
    shell_path: String;
    args: String;
}