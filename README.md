
# Agar.io Lite
[![Demo](https://img.shields.io/badge/demo-online-green.svg)](#demo)

An Agar.io inspired game. This is my own interpritation of the game creating the game mechanics from the ground up. 

---

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

### Prerequisites

To run this game server localy, you will need:
- NodeJS
- NPM

### Installing

Clone the sorce from Github, then run the following command from the project root dir:

```
npm install
```
this will install the dependencies for the project (express, socket.io, uuid).

### Configuring the game.

This isn't necesery to run the game but you can modify the server/config.json file to tweet the game paramiters to suit your style.

### Running the server.

Once dependencies are installed run the following command to host the server localy. 
```
npm start
```
You should now be able to access the client at 'http://localhost:{port number}' replace {port number} with port number set in the config file (default 3000).

---

## TODOs

-Improve game mechanics. The game pace feels a little slow.

---

## FAQ

1. **Why did you attempt to re-make this game?**

	I wanted to demonstrate my skills when it came to nodejs and websockets. The choice of game was not critical but found it was perfect to demo a wide range of skills both front and backend.

2. **Would you consider further developing this game to compete with Agar.io?**

	Honestly I currently don't see a reason to. My interests in this are purely skill based and any further developmet on this would be to further improve my skills.

3. **Can I use this for my own project?**

	Of course you can!

