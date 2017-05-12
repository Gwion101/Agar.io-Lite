var playerNameInput = document.getElementById('playerNameInput');
var socket = io();

var screenWidth = window.innerWidth;
var screenHeight = window.innerHeight;

var c = document.getElementById('cvs');
var canvas = c.getContext('2d');
c.width = screenWidth; 
c.height = screenHeight;

var KEY_ENTER = 13;

var game;
var gameRunning;
var chat;

function startGame() {
    var playerName = playerNameInput.value.replace(/(<([^>]+)>)/ig, '');
    socket.emit('playerJoined',{playerName:playerName});
    document.getElementById('gameAreaWrapper').style.display = 'block';
    document.getElementById('startMenuWrapper').style.display = 'none';
    game.newGame();
    gameRunning = true;
}

function endGame() {
	document.getElementById('gameAreaWrapper').style.display = 'none';
    document.getElementById('startMenuWrapper').style.display = 'block';
	gameRunning = false;
}

// check if nick is valid alphanumeric characters (and underscores)
function validNick() {
    var regex = /^\w*$/;
    return regex.exec(playerNameInput.value) !== null;
}

socket.on('disconnect', function (data) {
    endGame();
});

window.onload = function() {
    'use strict';
    game = new Game(self);
    chat = new Chat(self);
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

    playerNameInput.addEventListener('keypress', function (e) {
        var key = e.which || e.keyCode;

        if (key === KEY_ENTER) {
            if (validNick()) {
                startGame();
            } else {
                nickErrorText.style.display = 'inline';
            }
        }
    });
};

function SetupSocket(socket) {
  game.handleNetwork(socket);
  chat.handleNetwork(socket);
}

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
	if(gameRunning){
		game.handleGraphics(canvas);

	}
  	
}

window.addEventListener('resize', function() {
    screenWidth = window.innerWidth;
    screenHeight = window.innerHeight;
    c.width = screenWidth;
    c.height = screenHeight;
}, true);