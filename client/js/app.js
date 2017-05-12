var playerNameInput = document.getElementById('playerNameInput');
var socket = io();

var c = document.getElementById('cvs');
var canvas = c.getContext('2d');
c.width = screenWidth; 
c.height = screenHeight;
var screenWidth = window.innerWidth;
var screenHeight = window.innerHeight;

var KEY_ENTER = 13;

var game;
var gameRunning;
var chat;

// check if nick is valid alphanumeric characters (and underscores)
function validNick() {
    var regex = /^\w*$/;
    return regex.exec(playerNameInput.value) !== null;
}

socket.on('disconnect', function (data) {
    endGame();
});

//resize the canvas when the window resizes.
window.addEventListener('resize', function() {
    screenWidth = window.innerWidth;
    screenHeight = window.innerHeight;
    c.width = screenWidth;
    c.height = screenHeight;
}, true);

window.onload = function() {
    'use strict';
    game = new Game(self);//create a new game object.
    chat = new Chat(self);//create a new chat object.
    appLoop();
    
    SetupSocket(socket);

    var btn = document.getElementById('startButton'),
    nickErrorText = document.querySelector('#startMenu .input-error');
    btn.onclick = function () {
        // check if the nick is valid
        if (validNick()) {
            startGame();
        } else {
            nickErrorText.style.display = 'inline';
        }
    };

    playerNameInput.addEventListener('keypress', function (event) {
        var key = event.which || event.keyCode;

        if (key === 13) { // enter key pressed
            if (validNick()) {
                startGame();
            } else {
                nickErrorText.style.display = 'inline';
            }
        }
    });
};

/**
* setup sockets for chat and game objects.
* @param {Object} client socket.
*/
function SetupSocket(socket) {
  game.handleNetwork(socket);
  chat.handleNetwork(socket);
}

//far smoother than setInterval ;)
window.requestAnimationFrame = (function(){
    return  window.requestAnimationFrame       ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame    ||
            function( callback ){
                window.setTimeout(callback, 1000 / 60);
            };
})();

function appLoop() {
	requestAnimationFrame(appLoop);
	canvas.clearRect(0,0,screenWidth,screenHeight);
	//if the game is running update canvas.
	if(gameRunning)
		game.handleGraphics(canvas);
}

/**
* start the game.
*/
function startGame() {
	//sanatize the player name.
    var playerName = playerNameInput.value.replace(/(<([^>]+)>)/ig, '');
    socket.emit('playerJoined',{playerName:playerName});
    //hide the login screen and hide the canvas.
    document.getElementById('gameAreaWrapper').style.display = 'block';
    document.getElementById('startMenuWrapper').style.display = 'none';
    game.newGame();
    gameRunning = true;
}

/**
* end the game.
*/
function endGame() {
	//hide the canvas and show the login screen.
	document.getElementById('gameAreaWrapper').style.display = 'none';
    document.getElementById('startMenuWrapper').style.display = 'block';
	gameRunning = false;
}