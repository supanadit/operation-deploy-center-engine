// Author Supan Adit Pratama <supanadit@gmail.com>

export class GitModel {
    private _url: string;
    private _gitHost: string; // Brand Hosting Eg. Github, Bitbucket, etc
    private _domainName: string; // Domain Name Eg. Com, Org, Net
    private _userName: string; // Username from URL
    private _typeUrl: string; // SSH / HTTPS
    private _gitName: string;

    constructor(url: string) {
        this._url = '';
        this._gitHost = '';
        this._domainName = '';
        this._userName = '';
        this._typeUrl = '';
        this._gitName = '';

        const VerifyURL: string[] = url.split('/');
        let verifiedURL: boolean = false;
        if (VerifyURL.length == 0) {
            throw 'Invalid URL';
        } else {
            const FirstURL: string = VerifyURL[0].toString();

            this._gitName = VerifyURL[VerifyURL.length - 1].split('.')[0];

            const URLType: string[] = FirstURL.split('@');
            if (URLType.length != 0) {
                const VerifySSH = URLType[URLType.length - 1].split('.');
                this._gitHost = VerifySSH[0];
                const domainWithUsername = VerifySSH[VerifySSH.length - 1].split(':');
                this._domainName = domainWithUsername[0];
                this._userName = domainWithUsername[domainWithUsername.length - 1];
                this._typeUrl = 'SSH';
                verifiedURL = true;
            } else {
                const https: string = 'https';
                const http: string = 'http';
                const includeHttps: boolean = FirstURL.includes(https);
                const includeHttp: boolean = FirstURL.includes(http);
                if (includeHttps || includeHttp) {
                    let isValidUrl: boolean = false;
                    if (includeHttps) {
                        this._typeUrl = 'HTTPS';
                        if (FirstURL.substring(0, https.length - 1) == https.concat('://')) {
                            isValidUrl = true;
                        }
                    } else if (includeHttp) {
                        this._typeUrl = 'HTTP';
                        if (FirstURL.substring(0, http.length - 1) == http.concat('://')) {
                            isValidUrl = true;
                        }
                    } else {
                        throw 'Invalid URL';
                    }

                    if (isValidUrl) {
                        verifiedURL = true;
                    } else {
                        throw 'Invalid URL';
                    }
                }
            }
        }

        if (verifiedURL) {
            this._url = url;
        } else {
            throw 'Invalid URL';
        }
    }


    get url(): string {
        return this._url;
    }

    get gitHost(): string {
        return this._gitHost;
    }

    get domainName(): string {
        return this._domainName;
    }

    get userName(): string {
        return this._userName;
    }

    get typeUrl(): string {
        return this._typeUrl;
    }

    get gitName(): string {
        return this._gitName;
    }
}