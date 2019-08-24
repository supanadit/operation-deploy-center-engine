// System known message
import { spawn, spawnSync } from "child_process";

const ora = require('ora');

export const commandNotFound = "command not found";

export interface SystemAppCheckerInterface {
    name: string;
}

export class SystemAppChecker implements SystemAppCheckerInterface {
    name: string;
    protected valid: boolean = false;
    protected signal: any;
    protected message: string = "";

    constructor(name: string, signal = null) {
        this.name = name;
        this.signal = signal;
    }

    check() {
        const commandExecution = spawn(this.name, [], {
            shell: true,
        });
        const waiter: any = (this.signal == null) ? ora(`Checking ${this.name}`).start() : this.signal;
        commandExecution.on('close', (code: any) => {
            if (code == 0) {
                this.valid = true;
                this.message = `${this.name} have been installed`;
                if (this.signal == null) {
                    waiter.succeed(this.message);
                } else {
                    waiter.success(this.message);
                }
            } else {
                this.message = `${this.name} is not installed`;
                if (this.signal == null) {
                    waiter.fail(this.message);
                } else {
                    waiter.error(this.message);
                }
            }
        });
    }

    checkSync() {
        const commandExecution = spawnSync(this.name, []);
        const error = commandExecution.error;
        const waiter: any = (this.signal == null) ? ora(`Checking ${this.name}`).start() : this.signal;
        if (typeof error == "undefined") {
            this.valid = true;
            this.message = `${this.name} have been installed`;
            if (this.signal == null) {
                waiter.succeed(this.message);
            } else {
                waiter.success(this.message);
            }
        } else {
            this.message = `${this.name} is not installed`;
            if (this.signal == null) {
                waiter.fail(this.message);
            } else {
                waiter.error(this.message);
            }
        }
    }

    isValid(): boolean {
        return this.valid;
    }

    getMessage(): string {
        return this.message;
    }
}
