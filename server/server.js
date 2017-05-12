var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var uuid = require('uuid');
var config = require('./config.json');

var leaderboard = []; // game leaderboard.
var leaderboardChanged = false; // used to indicate leaderboard update.

var sockets = {};
var mapWidth =  config.mapWidth;
var mapHeight = config.mapHeight;

//super class of all entitys in game.
/**
* get
* @param {x:0,y:0,size:10,id:uuid,color:'#ffffff'}
* @return Player object
*/
var Entity = function(param) {
	var self = {
		x:param.x||0,
		y:param.y||0,
		size:param.size||0,
		id:param.id,
		velocityX:0,
		velocityY:0,
		baseColor:param.baseColor||'#ffffff'
	}

	//get distance form entitys center point.
	self.getDistanceFromEntityCenter = function(ent) {
		return Math.sqrt(Math.pow(self.x-ent.x,2) + Math.pow(self.y-ent.y,2));
	}

	//get distance from entitys external.
	self.getDistanceFromEntity = function(ent) {
		return getDistanceFromEntityCenter(ent)-self.size-ent.size;
	}

	//does self encompase the entity.
	self.isEntityPositonInternal = function(ent) {
		return self.size/2 > self.getDistanceFromEntityCenter(ent) + ent.size/2;
	}

	//update entity propertys
	self.update = function() {
		self.y +=self.velocityY;
		self.x +=self.velocityX;
		if(self.x<0)
			self.x=0;
		if(self.x>mapWidth)
			self.x=mapWidth;
		if(self.y<0)
			self.y=0;
		if(self.y>mapHeight)
			self.y=mapHeight;
	}

	return self;
}

/**
* Create new player object.
* @param {x:0,y:0,size:10,speed,id:uuid,name:'Gwion101',color:'#ffffff'}
* @return Player object
*/
var Player = function(param) {
	//Extend the entity object.
	var self = Entity(param);
	self.mouseAngle = 0;
	self.mouseDistance = 0;
	self.name = param.name||'default';
	self.defaultSpeed = param.speed;

	//Add two volumes together and calculate new size.
	self.consumeEntity = function(ent){
		self.size = Math.sqrt(Math.pow(self.size,2) + Math.pow(ent.size,2));
	}

	//calculate and update x,y speed values using mouseAngle and mouseDistance 
	self.updateVelocity = function() {
		//TODO infulence speed by size to handycap bigger players
		var speed = (self.mouseDistance/self.size) * self.defaultSpeed;
		self.velocityX = Math.cos(self.mouseAngle/180*Math.PI) * speed;
		self.velocityY = Math.sin(self.mouseAngle/180*Math.PI) * speed;
	}

	//overide super class function update.
	var super_update = self.update;
	//
	self.update = function(){
		//update platers velocity.
		self.updateVelocity();
		for(var i in Player.list){
			var player = Player.list[i];
			//Check to see if player has consumed self.
			var isConsumed = player.isEntityPositonInternal(self);
			if(isConsumed){
				player.consumeEntity(self);
				delete Player.list[self.id];
				removeData.players.push(self.id);
				newRemoveData = true;
				for (var i in sockets){
					sockets[i].emit('anouncement',{
						anouncement:self.name + ' was consumed by ' + player.name,
					});
				}
			}
		}
		super_update();
	}

	/**
 	* get inital data.
 	* @return {id:uuid,x:0,y:0,size:10,name:'Gwion101',baseColor:'#ffffff'}
 	*/
	self.getInitData = function(){
		return {
			id:self.id,
			x:self.x,
			y:self.y,
			size:self.size,
			name:self.name,
			baseColor:self.baseColor
		}
	}

	/**
 	* get updated data
 	* @return {id:uuid,x:0,y:0,size:10}
 	*/
	self.getUpdateData = function(){
		return {
			id:self.id,
			x:self.x,
			y:self.y,
			size:self.size
		}
	}

	//add to players list.
	Player.list[self.id] = self;

	//add new player to initData so other clients can add in player.
	initData.players.push(self.getInitData());
	newInitData = true;
	return self;
}

//list of all Player objects.
Player.list = [];

Player.update = function(){
	var data = [];
	for(var i in Player.list){
		var player = Player.list[i];
		player.update();
		data.push(player.getUpdateData());
	}
	return data;
}

Player.getAllInitData = function() {
	var currentPlayers = [];
	for (var i in Player.list) 
		currentPlayers.push(Player.list[i].getInitData());
	return currentPlayers;
}

//
Player.onConnect = function(socket,data){
	//construct player object
	var player = Player({
		x:mapWidth/2,
		y:mapHeight/2,
		size:config.playerSize,
		speed:config.defaultPlayerSpeed,
		id:socket.id,
		name:data.playerName,
		color:data.color,
	});

	//On receving a mouse update, update the players mouse distance, and angle.
	socket.on('mouseUpdate', function(data) {
		player.mouseAngle = data.mouseAngle;
		var maxDist = config.maxCursorDist;
		var mouseDist = data.mouseDistance;
		//clamp mouse distance to max distance.
		player.mouseDistance = ((mouseDist < maxDist) ? mouseDist : maxDist);
	});

	//On player Joining create new player objcet.
	socket.on('playerJoined', function(data){
		player.name = data.playerName;
	});

	//emit 'init' to client with initialisation data.
	socket.emit('init',{
		selfId:socket.id,
		map:{mapWidth:mapWidth, mapHeight:mapHeight},
		players:Player.getAllInitData(),
		pellets:Pellet.getAllInitData(),
		hazzards:Hazzard.getAllInitData(),
	});

	var playerName = Player.list[socket.id].name;
	for (var i in sockets){
		sockets[i].emit('anouncement',{
			anouncement:playerName + ' has joined',
		});
	}
}

Player.onDisconnect = function(player){
	for (var i in sockets){
		sockets[i].emit('anouncement',{
			anouncement:player.name + ' has left',
		});
	}
	delete Player.list[player.id];
	removeData.players.push(player.id);
}

//Pellet for players to consume.
var Pellet = function(param) {
	//Extend the entity object.
	var self = Entity(param);
	self.toRemove = false;

	//overide super class function update.
	var super_update = self.update;
	//
	self.update = function(){
		for(var i in Player.list){
			var player = Player.list[i];
			var isConsumed = player.isEntityPositonInternal(self);
			if(isConsumed){
				player.consumeEntity(self);
				self.toRemove = true;
			}
		}
		super_update();
	}

	self.getInitData = function(){
		return {
			id:self.id,
			x:self.x,
			y:self.y,
			size:self.size,
			baseColor:self.baseColor
		}
	}

	//add to pellet list.
	Pellet.list[self.id] = self;

	//add new pellet to initData so other clients can add in player.
	initData.pellets.push(self.getInitData());
	newInitData = true;
	return self;
}

Pellet.list = [];

Pellet.update = function(){
	var data = [];
	for(var i in Pellet.list){
		var pellet = Pellet.list[i];
		pellet.update();
		if(pellet.toRemove){
			delete Pellet.list[i];
			removeData.pellets.push(pellet.id);
			newRemoveData = true;
		}
	}
	return data;
}

Pellet.getAllInitData = function() {
	var currentPellets = [];
	for (var i in Pellet.list) 
		currentPellets.push(Pellet.list[i].getInitData());
	return currentPellets;
}

//Hazzard that large players to get dammage.
var Hazzard = function(param) {
	var self = Entity(param);

	var super_update = self.update;
	self.update = function(){
		for(var i in Player.list){
			var player = Player.list[i];
			if(player.isEntityPositonInternal(self)){
				player.size -= 1;
			}
		}
		super_update();
	}

	self.getInitData = function(){
		return {
			id:self.id,
			x:self.x,
			y:self.y,
			size:self.size,
			baseColor:self.baseColor
		}
	}

	//add to hazzard list.
	Hazzard.list[self.id] = self;

	//add new hazzard to initData so other clients can add in player.
	initData.hazzards.push(self.getInitData());
	return self;
}

Hazzard.list = [];

Hazzard.update = function(){
	var data = [];
	for(var i in Hazzard.list){
		var hazzard = Hazzard.list[i];
		hazzard.update();
	}
	return data;
}

Hazzard.getAllInitData = function() {
	var currentHazzards = [];
	for (var i in Hazzard.list) 
		currentHazzards.push(Hazzard.list[i].getInitData());
	return currentHazzards;
}

app.use(express.static(__dirname + '/../client'));

io.on('connection', function (socket) {
	socket.id = uuid.v1(); //Generate a time based ID.
	sockets[socket.id] = socket;

	socket.on('playerJoined', function(data){
		Player.onConnect(socket,data);
	});

	socket.on('globalMessage', function(data){
		var sender = Player.list[data.senderId].name;
		var message = data.message;
		for (var i in sockets){
			var socket = sockets[i];
			socket.emit('newMessage',{
				sender:sender,
				message:message,
			});
		}
	});

	socket.on('disconnect', function(){
		var player = Player.list[socket.id];
		if(player !== undefined)
			Player.onDisconnect(player);	
		delete sockets[socket.id];
	});
});

var initData = {players:[],pellets:[],hazzards:[]};
var newInitData = false;
var removeData = {players:[],pellets:[]};
var newRemoveData = false;

setInterval(function(){
	var noOfPellets = Object.keys(Pellet.list).length;
	for(i = noOfPellets; i < config.pelletDensity; i++){
		var pettelColors = config.pelletColors;
		var pelletColor = pettelColors[Math.floor((Math.random() * pettelColors.length))];

		var pellet = Pellet({
			x:Math.floor(mapWidth * Math.random()),
			y:Math.floor(mapHeight * Math.random()),
			size:config.pelletSize,
			baseColor:pelletColor,
			id:uuid.v1() //Generate a time based ID.
		});
	}

	var noOfHazzards = Object.keys(Hazzard.list).length;
	for(i = noOfHazzards; i < config.hazzardDensity; i++){
		var hazzard = Hazzard({
			x:Math.floor(mapWidth * Math.random()),
			y:Math.floor(mapHeight * Math.random()),
			size:config.hazzardSize,
			baseColor:config.hazzardColor,
			id:uuid.v1() //Generate a time based ID.
		});
	}

	var updateData = {
		players:Player.update()
	}
	Pellet.update();
	Hazzard.update();

	for (var i in sockets) {
		var socket = sockets[i];
		if(newInitData)
			socket.emit('init',initData);
		if(newRemoveData)
			socket.emit('remove',removeData);
		if(updateData !== [])
			socket.emit('update',updateData);
	}
	newInitData = false;
	newRemoveData = false;
	initData.players = [];
	initData.pellets = [];
	initData.hazzards = [];
	newRemoveData = [];
	removeData.players = [];
	removeData.pellets = [];

}, 1000 / 60);

var serverPort = process.env.PORT || config.port;
http.listen(serverPort,'0.0.0.0', function() {
  	console.log("Server is listening on port " + serverPort);
});
