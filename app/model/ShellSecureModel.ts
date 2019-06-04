export class ShellSecureModel {
    private _host: String;
    private _username: String;
    private _password: String;
    private _port: String;

    constructor(host: String, username: String, password: String, port: String = "") {
        this._host = host;
        this._username = username;
        this._password = password;
        this._port = port;
    }


    get host(): String {
        return this._host;
    }

    set host(value: String) {
        this._host = value;
    }

    get username(): String {
        return this._username;
    }

    set username(value: String) {
        this._username = value;
    }

    get password(): String {
        return this._password;
    }

    set password(value: String) {
        this._password = value;
    }


    get port(): String {
        return this._port;
    }

    set port(value: String) {
        this._port = value;
    }
}