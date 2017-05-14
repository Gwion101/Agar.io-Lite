var playerNameInput = document.getElementById('playerNameInput');
var playerColorInput = document.getElementById('playerColorInput');
var inputError = document.querySelector('#startMenu .input-error');
var errorDisplay = document.querySelector('#startMenu .error-display');
var joinBtn = document.getElementById("startButton");
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

// check if nick is valid alphanumeric characters (and underscores)
function validNick() {
    var regex = /^\w*$/;
    return regex.exec(playerNameInput.value) !== null;
}

socket.on('connect', function(){
	joinBtn.disabled = false;
	errorDisplay.style.display = 'none';
});

//
socket.on('disconnect', function () {
    if(gameRunning) {
    	document.getElementById('gameAreaWrapper').style.display = 'none';
    	document.getElementById('startMenuWrapper').style.display = 'block';
		gameRunning = false;
	}
    joinBtn.disabled = true;
    errorDisplay.style.display = 'block';
    errorDisplay.innerHTML = 'Error: Lost connection with server.';
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

    joinBtn.onclick = function () {
        validateAndJoin();
    };

    playerNameInput.addEventListener('keypress', function (event) {
        var key = event.which || event.keyCode;

        if (key === 13) { // enter key pressed
            validateAndJoin();
        }
    });
};

function validateAndJoin(){
	// check if the nick is valid
	if (validNick()) {
        startGame();
        inputError.style.display = 'none';
    } else {
    	inputError.innerHTML = 'Invallid name AlphaNumeric only.';
        inputError.style.display = 'inline';
        playerNameInput.value = '';
    }
}

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
	//if the game is running update canvas.
	if(gameRunning)
		canvas.clearRect(0,0,screenWidth,screenHeight);
		game.handleGraphics(canvas);
}

/**
* start the game.
*/
function startGame() {
	//sanatize the player name.
    var playerName = playerNameInput.value.replace(/(<([^>]+)>)/ig, '');
    var baseColor = '#' + playerColorInput.value;
    socket.emit('playerJoined',{playerName,baseColor});
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
	gameRunning = false;
	canvas.clearRect(0,0,screenWidth,screenHeight);
    canvas.fillStyle = '#ffffff';
	canvas.font = 'bold 80px Verdana';
	canvas.textAlign = 'center';
	canvas.lineWidth = 2;
	canvas.fillText('Game Over', screenWidth/2, screenHeight/2);
	canvas.strokeStyle="#000000";
	canvas.strokeText('Game Over', screenWidth/2, screenHeight/2);
	setTimeout(function() {
		document.getElementById('gameAreaWrapper').style.display = 'none';
    	document.getElementById('startMenuWrapper').style.display = 'block';
	}, 4000);
}