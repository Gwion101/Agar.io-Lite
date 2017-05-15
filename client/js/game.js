
function Game(application) {
	app = application;
};

var app;
var selfId = '';
var socket;
var map;

var img = {};
	img.map = new Image();
	img.map.src = '/img/map.svg';

/**
* Create new Player object.
* @param {Object} the socket object.
*/
Game.prototype.handleNetwork = function(socket) {

	this.socket = socket;

	socket.on('playerInit', function({selfId,map,players,pellets,hazzards}){
	  	if(selfId) 
	  		self.selfId = selfId;
	  	if(map)
	  		self.map = new Map(map.mapWidth,map.mapHeight);
	  	for(var i = 0; i < players.length; i++)
	  		new Player(players[i]);
	  	for(var i = 0; i < pellets.length; i++)
	  		new Pellet(pellets[i]);
	  	for(var i = 0; i < hazzards.length; i++)
	  		new Hazzard(hazzards[i]);
  	});

  	socket.on('init', function({players,pellets,hazzards}){
	  	for(var i = 0; i < players.length; i++)
	  		new Player(players[i]);
	  	for(var i = 0; i < pellets.length; i++)
	  		new Pellet(pellets[i]);
	  	for(var i = 0; i < hazzards.length; i++)
	  		new Hazzard(hazzards[i]);
  	});

  	socket.on('update', function({players}){
	  	for(var i = 0; i < players.length; i++){
			var updatedPlayerData = players[i];
			var player = Player.list[updatedPlayerData.id];
			if(player){
				player.x = updatedPlayerData.x||player.x;
				player.y = updatedPlayerData.y||player.y;
				player.hp = updatedPlayerData.hp||player.hp;
				player.size = updatedPlayerData.size||player.size;
			}
		}
  	});

  	socket.on('remove',function({players,pellets}){
		for(var i = 0; i < players.length; i++){
			if(players[i] === selfId){
				selfId = null; 
				app.endGame();
			}
			delete Player.list[players[i]];
		}
		for(var i = 0; i < pellets.length; i++){
			delete Pellet.list[pellets[i]];
		}
	});

	self.document.onmousemove = function(event){
		if(!app.gameRunning)
			return;
		var x = -screenWidth/2 + event.clientX;
		var y = -screenHeight/2 + event.clientY;
		//calculate mouse angle relitive to player.
		var angle = Math.atan2(y,x)/Math.PI * 180;
		//calculate mouse distance from player using pythagoras.
		var distance = Math.sqrt(Math.pow(x,2) + Math.pow(y,2));
		//emit mouse input data to server.
		socket.emit('mouseUpdate',{
			inputId:'mouseAngle',
			mouseAngle:angle,
			mouseDistance:distance
		});
	}
}
/**
* Handle graphics.
* @param {Canvas} the canvas to draw the graphics onto.
*/
Game.prototype.handleGraphics = function(canvas) {
	if(!app.gameRunning)
		return;
	if(map !== undefined)
		map.draw(canvas);
	//draw pellets first so players will render over them.	
	for(var i in Pellet.list)
		Pellet.list[i].draw(canvas);
	for(var i in Player.list)
		Player.list[i].draw(canvas);
	for(var i in Hazzard.list)
		Hazzard.list[i].draw(canvas);
}

/**
* Setup a new game.
*/
Game.prototype.newGame = function(){
	Player.list = [];
	Pellet.list = [];
	Hazzard.list = [];
}

/**
* Create new Player object.
* @param {Object} the player object values.
*/
var Player = function({id,x,y,size,baseColor,name}){
	var self = {};
	self.id = id;
	self.x = x;
	self.y = y;
	self.size = size;
	self.baseColor = baseColor;
	self.name = name;
	Player.list[self.id] = self;

	self.draw = function(canvas){
		//calc player position on canvas relitive to player.
		var x = self.x - Player.list[selfId].x + screenWidth/2;
		var y = self.y - Player.list[selfId].y + screenHeight/2;
		var radius = self.size/2;
		//render player object.
		canvas.beginPath();
		canvas.fillStyle = self.baseColor;
		canvas.arc(x,y,radius,0,2*Math.PI);
		canvas.fill();
		canvas.strokeStyle="#ffffff";
		canvas.stroke();
		//render player name.
		canvas.fillStyle = '#ffffff';
		canvas.font = 'bold ' + self.size/4 + 'px Verdana';
		canvas.textAlign = 'center';
		canvas.lineWidth = 2;
		canvas.fillText(self.name, x, y);
		canvas.strokeStyle='#000000';
		canvas.strokeText(self.name, x, y);
	}
	return self;
}

Player.list = [];

/**
* Create new Pellet object.
* @param {Object} the Pellet object values.
*/
var Pellet = function({id,x,y,size,baseColor}){
	var self = {};
	self.id = id;
	self.x = x;
	self.y = y;
	self.size = size;
	self.baseColor = baseColor;
	Pellet.list[self.id] = self;

	self.draw = function(canvas){
		//calc pellet position on canvas relitive to player.
		var x = self.x - Player.list[selfId].x + screenWidth/2;
		var y = self.y - Player.list[selfId].y + screenHeight/2;
		var radius = self.size/2;
		//render pellet.
		canvas.beginPath();
		canvas.fillStyle = self.baseColor;
		canvas.arc(x,y,radius,0,2*Math.PI);
		canvas.fill();
	}
	return self;
}

Pellet.list = [];

/**
* Create new Hazzard object.
* @param {Object} the Hazzard object values.
*/
var Hazzard = function({id,x,y,size,baseColor}){
	var self = {};
	self.id = id;
	self.x = x;
	self.y = y;
	self.size = size;
	self.baseColor = baseColor;
	Hazzard.list[self.id] = self;

	self.draw = function(canvas){
		//calc hazzard position on canvas relitive to player.
		var x = self.x - Player.list[selfId].x + screenWidth/2;
		var y = self.y - Player.list[selfId].y + screenHeight/2;
		var radius = self.size/2;
		//render pellet.
		canvas.beginPath();
		canvas.fillStyle = self.baseColor;
		canvas.arc(x,y,radius,0,2*Math.PI);
		canvas.fill();
	}
	return self;
}

Hazzard.list = [];

/**
* Create new Map object.
* @param {Object} the map object values.
*/
var Map = function(mapWidth,mapHeight) {
	self.mapWidth = mapWidth;
	self.mapHeight = mapHeight;
	self.draw = function(canvas){
		var x = screenWidth/2 - Player.list[selfId].x;
		var y = screenHeight/2 - Player.list[selfId].y;
		canvas.drawImage(img.map,x,y,self.mapWidth,self.mapHeight);
	}
	return self;
}