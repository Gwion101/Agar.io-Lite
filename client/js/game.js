
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

Game.prototype.handleNetwork = function(socket) {

	this.socket = socket;

  	socket.on('init', function(data){
	  	if(data.selfId) 
	  		selfId = data.selfId;
	  	if(data.map)
	  		map = new Map(data.map);
	  	for(var i = 0; i < data.players.length; i++)
	  		new Player(data.players[i]);
	  	for(var i = 0; i < data.pellets.length; i++)
	  		new Pellet(data.pellets[i]);
	  	for(var i = 0; i < data.hazzards.length; i++)
	  		new Hazzard(data.hazzards[i]);
  	});

  	socket.on('update', function(data){
	  	for(var i = 0; i < data.players.length; i++){
			var updatedPlayerData = data.players[i];
			var player = Player.list[updatedPlayerData.id];
			if(player){
				player.x = updatedPlayerData.x||player.x;
				player.y = updatedPlayerData.y||player.y;
				player.hp = updatedPlayerData.hp||player.hp;
				player.size = updatedPlayerData.size||player.size;
			}
		}
  	});

  	socket.on('remove',function(data){
		for(var i = 0; i < data.players.length; i++){
			if(data.players[i] === selfId){
				selfId = null; 
				app.endGame();
			}
			delete Player.list[data.players[i]];
		}
		for(var i = 0; i < data.pellets.length; i++){
			delete Pellet.list[data.pellets[i]];
		}
	});

	self.document.onmousemove = function(event){
		if(!app.gameRunning)
			return;
		var x = -screenWidth/2 + event.clientX;
		var y = -screenHeight/2 + event.clientY;
		var angle = Math.atan2(y,x)/Math.PI * 180;
		var distance = Math.sqrt(Math.pow(x,2) + Math.pow(y,2));
		socket.emit('mouseUpdate',{
			inputId:'mouseAngle',
			mouseAngle:angle,
			mouseDistance:distance
		});
	}

}

Game.prototype.handleGraphics = function(canvas) {
	if(!app.gameRunning)
		return;
	map.draw(canvas);
	//draw pellets first so players will render over them.	
	for(var i in Pellet.list)
		Pellet.list[i].draw(canvas);
	for(var i in Player.list)
		Player.list[i].draw(canvas);
	for(var i in Hazzard.list)
		Hazzard.list[i].draw(canvas);
}

Game.prototype.newGame = function(){
	Player.list = [];
	Pellet.list = [];
	Hazzard.list = [];
}

var Player = function(param){
	var self = {};
	self.id = param.id;
	self.x = param.x;
	self.y = param.y;
	self.size = param.size;
	self.baseColor = param.baseColor;
	self.name = param.name;
	Player.list[self.id] = self;

	self.draw = function(canvas){
		var x = self.x - Player.list[selfId].x + screenWidth/2;
		var y = self.y - Player.list[selfId].y + screenHeight/2;
		var radius = self.size/2;

		canvas.beginPath();
		canvas.fillStyle = self.baseColor;
		canvas.arc(x,y,radius,0,2*Math.PI);
		canvas.fill();

		canvas.fillStyle = '#ffffff';
		canvas.font = 'bold ' + self.size/4 + 'px Verdana';
		canvas.textAlign = 'center';
		canvas.lineWidth = 2;
		canvas.fillText(self.name, x, y);
		canvas.strokeText(self.name, x, y);
	}
	return self;
}

Player.list = [];

var Pellet = function(param){
	var self = {};
	self.id = param.id;
	self.x = param.x;
	self.y = param.y;
	self.size = param.size;
	self.baseColor = param.baseColor;
	Pellet.list[self.id] = self;

	self.draw = function(canvas){
		var x = self.x - Player.list[selfId].x + screenWidth/2;
		var y = self.y - Player.list[selfId].y + screenHeight/2;
		var radius = self.size/2;

		canvas.beginPath();
		canvas.fillStyle = self.baseColor;
		canvas.arc(x,y,radius,0,2*Math.PI);
		canvas.fill();
	}

	return self;
}

Pellet.list = [];

var Hazzard = function(param){
	var self = {};
	self.id = param.id;
	self.x = param.x;
	self.y = param.y;
	self.size = param.size;
	self.baseColor = param.baseColor;
	Hazzard.list[self.id] = self;

	self.draw = function(canvas){
		var x = self.x - Player.list[selfId].x + screenWidth/2;
		var y = self.y - Player.list[selfId].y + screenHeight/2;
		var radius = self.size/2;

		canvas.beginPath();
		canvas.fillStyle = self.baseColor;
		canvas.arc(x,y,radius,0,2*Math.PI);
		canvas.fill();
	}

	return self;
}

Hazzard.list = [];

var Map = function(param) {
	self.mapWidth = param.mapWidth;
	self.mapHeight = param.mapHeight;
	self.draw = function(canvas){
		var x = screenWidth/2 - Player.list[selfId].x;
		var y = screenHeight/2 - Player.list[selfId].y;
		canvas.drawImage(img.map,x,y,self.mapWidth,self.mapHeight);
	}
	return self;
}