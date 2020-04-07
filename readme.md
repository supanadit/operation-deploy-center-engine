## Description

More than Continuous Integration

## How to setup 
1. Clone this repository
3. Make sure `Node JS` have been installed
4. `npm install`
5. `npm run dev`

## Supported OS
- Mac OS
- Windows
- Linux

## This App Will Be Available For
- Self Hosting
- Official Hosting

## Feature
- Client Only Mode
- Client / Server Mode
- Target Mode ( Soon ) will be available using two method ( Shell Script / Target App ( Golang ))

## Todo
- Support FTP / SFTP / SSH
- VCS Support for SSH Method
- Compressing Support for FTP / SFTP / SSH ( Upload Method )
- Building App by Supported Technology
- Deploy to selected server using ( Upload Method )
- Realtime Log ( RethinkDB )
- Terminal Operation ( SSH )
- Auto Building and Deploy to selected server using ( Target Mode )
- Create Plugin for Visual Studio Code, PHP Storm, Intellij Idea, Webstorm, Ruby Mine, Rider, Goland, Android Studio, Pycharm, Clion and Sublime Text
- Currently Support Public GIT Repository Only
- ORM Integration with Sequelize ( OK )
- Integration with Octokit ( OK )
- Get all repository from github
- Get all only forked repository from github
- Auto update forked repository from github
- Delete folder repository from github
- Documentation
- Zip file in windows using 7z

## Step By Step To Setup
- Clone this Repository
- Make Sure Node JS have been installed
- `npm install` wait until finish
- Run `npm run dev`

## Current API Ready
- GET `/ssh` List all SSH saved on engine storage
- POST `/ssh/save` Save SSH Account
- POST `/git/clone` Clone Repository
- POST `/git/compress` Compressing Repository
- POST `/git/remove` Remove Repository and Archive which related to Repository
- POST `/git/script` Running Script for Specific Repository and Specific Script
- POST `/git/update` Get update of Repository similar like `git pull`
- POST `/git/save` Save Repository without Cloning the Repository
- GET `/git` Get list all saved git from engine storage
- POST `/run/deploy` Deploy git and run Script at the same time to selected Server with folder Target
- POST `/upload/zip` Upload archive to selected Server
- GET `/script` To Get All Scripts
- POST `/script/save` Create & Save Script
- POST `/unzip` Unzip specific Git at the server which has to be uploaded on the Server
