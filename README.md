
# Agar.io Lite
[![Demo](https://img.shields.io/badge/demo-online-green.svg)](https://agar-io-lite.herokuapp.com) Very stable thanks to the many people of the SimNation community for test playing this, and using up my heroku server dyno hours…

An Agar.io inspired game, built from the ground up. Built on the NodeJS platform, using the popular Socket.IO module for websocket communication.

---

## How it works

The game itself isn’t overly complicated, the maths involved have been detailed in this pdf. The server calculates all the player movements and game mechanics and then emits them to the client players where it is rendered on a canvas. No game logic is done on the client side, only rendering and player input. This prevents manipulation to the fronted js to gain an unfair advantage when playing. 

---

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

To run this game server locally, you will need:
- NodeJS
- NPM

### Installing

Clone the source from Github, then run the following command from the project root dir:

```
npm install
```
this will install the dependencies for the project (express, socket.io, uuid).

### Configuring the game.

This isn't necessary to run the game but you can modify the server/config.json file to tweet the game parameters to suit your style.

### Running the server.

Once dependencies are installed run the following command to host the server locally. 
```
npm start
```
You should now be able to access the client at 'http://localhost:{port number}' replace {port number} with port number set in the config file (default 3000).

---

## TODOs

- Improve game mechanics. The game pace feels a little slow.
- Inclusion of AI. Just to make the game more interesting when no one else is around.
- Add leaderboard.
- Make some more intelligent random spawning.

---

## FAQ

1. **Why did you attempt a re-make of this game?**

	I wanted to demonstrate my skills when it came to nodejs and websockets. The choice of game was not critical but found it was perfect to demo a wide range of skills in full stack development.

2. **Would you consider further developing this game to compete with Agar.io?**

	Honestly I currently don't see a reason to. My interests in this are purely skill based and any further development on this would be to further improve my skills.

3. **Can I use this for my own project?**

	Of course you can!

