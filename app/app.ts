// lib/app.ts
'use strict';
import { ShellSecureModel } from "./model/ShellSecureModel";
import { OperatingSystemOperation } from "./helper/OperatingSystemOperation";

import bodyParser = require('body-parser');
import express = require("express");

const {Signale} = require('signale');
const chalk = require('chalk');
const CFonts = require('cfonts');

// Create a new express application instance
const app: express.Application = express();

app.use(bodyParser.json());
app.get('/', function (req, res) {
    res.send('Hello World!');
});

app.post('/start', function (req, res) {
    let ssh: ShellSecureModel;

    try {
        ssh = req.body;
        const myOs: OperatingSystemOperation = new OperatingSystemOperation();
        myOs.executeCommand("git clone https://supanadit@bitbucket.org/xenos500/beton-mobile-staff.git ./operation/beton");
        res.send('Start Process for Host : ' + ssh.host);
    } catch (e) {
        console.log("Error : " + e);
    }
});

CFonts.say('Auto Engine', {
    font: 'block',
});

console.log("Software :", chalk.rgb(255, 255, 255).dim("Auto Engine"));
console.log("");
console.log("Author : Supan Adit Pratama", chalk.rgb(255, 255, 255).underline("<supan.aditp@xenos.co.id>"));
console.log("");
console.log("Version :", chalk.hex("#FFFFFF").bgBlue(" 1.0 "));
console.log("");
console.log("Current OS : ", chalk.hex("#FFFFFF").bgRed(" " + OperatingSystemOperation.checkOperatingSystem().name + " "));
console.log("");
const processStart = new Signale({interactive: true, scope: 'Starting Server'});
processStart.await("Starting Server");
setTimeout(function () {
    if (OperatingSystemOperation.checkIsAllowedOperatingSystem()) {
        app.listen(3000, function () {
            processStart.success("Engine success started on port 3000")
        });
    } else {
        processStart.error("Engine failed to start");
    }
}, 1000);
