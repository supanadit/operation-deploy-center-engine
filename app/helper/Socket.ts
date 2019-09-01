import { Log } from '../model/Log';

export class Socket {
    clientSocket: any;
    globalSocket: any;
    listOperationMemory: Log[] = [];

    constructor(io: any) {
        this.globalSocket = io;
        this.globalSocket.on('connection', (client: any) => {
            this.clientSocket = client;
            this.reloadListOperationMemory();
            this.clientSocket.on('get-operation', () => {
                this.clientSocket.emit('operation', JSON.stringify(this.getListOperationMemory()));
            });
            this.clientSocket.on('clear-operation', () => {
                this.listOperationMemory = [];
                this.reloadListOperationMemory();
            });
            this.clientSocket.on('disconnect', () => {
            });
        });
    }

    updateOperationMemory(operation: Log, index: number) {
        this.listOperationMemory[index] = operation;
        this.reloadListOperationMemory();
    }

    getListOperationMemory() {
        return this.listOperationMemory.map((x: Log) => x.get());
    }

    reloadListOperationMemory() {
        this.globalSocket.emit('operation', JSON.stringify(this.getListOperationMemory()));
    }
}
