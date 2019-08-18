import { spawn, spawnSync } from 'child_process';
import { Git }              from '../model/Git';

const ora = require('ora');

export interface OperatingSystem {
    name: String;
    short_name: String;
    shell_path: String;
    args: String;
}

export class OperatingSystemOperation {
    private static knownOperatingSystem: OperatingSystem[] = [
        {name: 'Windows', short_name: 'win32', shell_path: 'cmd.exe', args: '/c'},
        {name: 'Linux', short_name: 'linux', shell_path: '', args: ''},
    ];

    public executeCommand(command: String, async: boolean = true) {
        const currentOs: OperatingSystem = OperatingSystemOperation.checkOperatingSystem();
        const commandRoot = (currentOs.shell_path == '') ? command : currentOs.shell_path;
        const listReceivedCommand: String[] = command.split(' ');
        const listArgs: String[] = currentOs.args.split(' ');
        const listExecutioner = (currentOs.args == '') ? listReceivedCommand : listArgs.concat(listReceivedCommand);
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
        const spinner = ora('Pleasewait.. Executing \n').start();
        commandExecution.stdout.on('data', (data: any) => console.log(`stdout: ${data.toString()}`));
        commandExecution.stderr.on('data', (data: any) => {
            // console.log(`Stderr : ${data.toString()}`);
        });
        commandExecution.on('close', (code: any) => {
            if (code == 0) {
                spinner.succeed('Operation Success');
            } else {
                spinner.fail('Operation Failed');
            }
        });
    }

    // Currently This Function Support on Linux Only
    public gitClone(git: Git, async: boolean = false) {
        let commandExecution: any;
        if (async) {
            // @ts-ignore
            commandExecution = spawn('git', ['clone', git.url, git.getRepositorySaveLocation()], {
                shell: true
            });
        } else {
            // @ts-ignore
            commandExecution = spawnSync('git', ['clone', git.url, git.getRepositorySaveLocation()]);
        }
        const spinner = ora(`Please wait, Cloning ${git.url}\n`).start();
        commandExecution.on('close', (code: any) => {
            if (code == 0) {
                spinner.succeed(`Success Cloning Repository ${git.url}`);
                git.cloned = true;
                git.createConfigFile();
            } else {
                spinner.fail(`Failed to Cloning Repository ${git.url}`);
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
        const indexNumber = this.findOperatingSystem(process.platform);
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