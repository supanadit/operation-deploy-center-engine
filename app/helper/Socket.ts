import { Operation } from '../model/Operation';

export class Socket {
    clientSocket: any;
    globalSocket: any;
    listOperationMemory: Operation[] = [];

    constructor(io: any) {
        this.globalSocket = io;
        this.globalSocket.on('connection', (client: any) => {
            this.clientSocket = client;
            this.reloadListOperationMemory();
            this.clientSocket.on('get-operation', () => {
                this.clientSocket.emit('operation', JSON.stringify(this.getListOperationMemory()));
            });
            this.clientSocket.on('disconnect', () => {
            });
        });
    }

    updateOperationMemory(operation: Operation, index: number) {
        this.listOperationMemory[index] = operation;
        this.reloadListOperationMemory();
    }

    getListOperationMemory() {
        return this.listOperationMemory.map((x: Operation) => x.get());
    }

    reloadListOperationMemory() {
        this.globalSocket.emit('operation', JSON.stringify(this.getListOperationMemory()));
    }
}
