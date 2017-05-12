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
var initData = {players:[],pellets:[],hazzards:[]};
var newInitData = false;
var removeData = {players:[],pellets:[]};
var newRemoveData = false;
//set up routes.
app.use(express.static(__dirname + '/../client'));

var serverPort = process.env.PORT || config.port;
http.listen(serverPort,'0.0.0.0', function() {
  	console.log("Server is listening on port " + serverPort);
});

//setup socket.io
io.on('connection', function (socket) {
	socket.id = uuid.v1(); //Generate a time based ID.
	sockets[socket.id] = socket; // add socket to socket list.

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

//super class of all entitys in game.
/**
* Create new Entity object.
* @param {Object} the entity object values.
* @return {Object} the Entity object.
*/
var Entity = function(param) {
	//set object parameters.
	var self = {
		x:param.x||0,
		y:param.y||0,
		size:param.size||0,
		id:param.id,
		velocityX:0,
		velocityY:0,
		baseColor:param.baseColor||'#ffffff'
	}

	/**
	* Get the distace between entity centers.
	* @param {Object} the second entity
	* @return {number} resulting distance
	*/
	self.getDistanceFromEntityCenter = function(ent) {
		return Math.sqrt(Math.pow(self.x-ent.x,2) + Math.pow(self.y-ent.y,2));
	}

	/**
	* check if entity is intersecting with self.
	* @param {Object} the second entity
	* @return {bool}
	*/
	self.isEntityPositonIntersected = function(ent) {
		//get distance between edges.
		var dist = getDistanceFromEntityCenter(ent)-self.size/2-ent.size/2;
		//if dist is -ive then the two entitys are intersecting.
		var isIntersecting = dist < 0
		return isIntersecting;
	}

	/**
	* Get the distace between entity centers.
	* @param {Object} the second entity
	* @return {bool} resulting distance
	*/
	self.isEntityPositonInternal = function(ent) {
		//get distance between centers.
		var distFromCenter = self.getDistanceFromEntityCenter(ent);
		//if dist from centers + ent radius are < than self radius then ent is internal.
		var isInternal = self.size/2 > distFromCenter + ent.size/2;
		return isInternal;
	}

	/**
	* update entity propertys
	*/
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
* Create new Player object.
* @param {Object} the player object values.
* @return {Object} Player object
*/
var Player = function(param) {
	//Extend the entity object.
	var self = Entity(param);
	self.mouseAngle = 0;
	self.mouseDistance = 0;
	self.name = param.name||'default';
	self.defaultSpeed = param.speed;

	/**
	* add entitys volume to self and calc size.
	* @param {Object} the second entity
	*/
	self.addVolume = function(ent){
		self.size = Math.sqrt(Math.pow(self.size,2) + Math.pow(ent.size,2));
	}

	/**
	* calculate and update x,y velocity values using mouseAngle and mouseDistance.
	*/
	self.updateVelocity = function() {
		// calculate base speed factoring size and mouse distance form player.
		var speed = (self.mouseDistance/self.size) * self.defaultSpeed;
		// using mouse angle split the velocity into x,y components.
		self.velocityX = Math.cos(self.mouseAngle/180*Math.PI) * speed;
		self.velocityY = Math.sin(self.mouseAngle/180*Math.PI) * speed;
	}

	//retain super class function for overide.
	var super_update = self.update;
	
	/**
	* run update logic.
	*/
	self.update = function(){
		//update platers velocity.
		self.updateVelocity();
		for(var i in Player.list){
			var player = Player.list[i];
			//Check to see if player has consumed self.
			var isConsumed = player.isEntityPositonInternal(self);
			if(isConsumed){
				//player was consumed and will now be removed.
				player.addVolume(self);
				delete Player.list[self.id];
				removeData.players.push(self.id);
				newRemoveData = true;
				//send all connected a message that the player was consumed.
				for (var i in sockets){
					sockets[i].emit('anouncement',{
						anouncement:player.name + ' consumed ' + self.name,
					});
				}
			}
		}
		super_update();
	}

	/**
 	* get inital data.
 	* @return {Object} required player values for client to initalise player.
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
 	* @return {Object} required player values for client to update player.
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

	//add new player to initData so other clients can add in new player.
	initData.players.push(self.getInitData());
	newInitData = true;
	return self;
}

//list of all Player objects.
Player.list = [];

/**
* Get update data for all players.
* @return {Object[]} list of all relevent player update values.
*/
Player.update = function(){
	var data = [];
	for(var i in Player.list){
		var player = Player.list[i];
		player.update();
		data.push(player.getUpdateData());
	}
	return data;
}

/**
* Get inital data for all players.
* @return {Object[]} list of player objects for client to initalise.
*/
Player.getAllInitData = function() {
	var currentPlayers = [];
	for (var i in Player.list) 
		currentPlayers.push(Player.list[i].getInitData());
	return currentPlayers;
}

/**
* Get inital data for all players.
* @param {Object} socket object.
* @param {Object} data to initalise object.
*/
Player.onConnect = function(socket,data){
	//construct player object
	var player = Player({
		x:Math.floor(mapWidth * Math.random()),
		y:Math.floor(mapHeight * Math.random()),
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

	//On player Joining create new player object.
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

	//send all connected users the message that the player has joined.
	for (var i in sockets){
		sockets[i].emit('anouncement',{
			anouncement:player.name + ' has joined',
		});
	}
}

/**
* Disconnect player from game.
* @return {Object} player object to remove.
*/
Player.onDisconnect = function(player){
	//send all connected users the message that the player has left.
	for (var i in sockets){
		sockets[i].emit('anouncement',{
			anouncement:player.name + ' has left',
		});
	}
	//remove player from list.
	delete Player.list[player.id];
	removeData.players.push(player.id);
}

/**
* Create new Pellet object.
* @param {Object} the pellet object values.
* @return {Object} Pellet object.
*/
var Pellet = function(param) {
	//Extend the entity object.
	var self = Entity(param);
	self.toRemove = false;

	//retain super class function for overide.
	var super_update = self.update;
	
	/**
	* run update logic.
	*/
	self.update = function(){
		for(var i in Player.list){
			var player = Player.list[i];
			var isConsumed = player.isEntityPositonInternal(self);
			if(isConsumed){
				// pellet was consumed, mark for removal and add volume to player.
				player.addVolume(self);
				self.toRemove = true;
			}
		}
		super_update();
	}

	/**
 	* get inital data.
 	* @return {Object} required pellet values for client to initalise pellet.
 	*/
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

	//add new pellet to initData so other clients can add in pellet.
	initData.pellets.push(self.getInitData());
	newInitData = true;
	return self;
}

//list of all pellets in game.
Pellet.list = [];

/**
* Get update data for all pellets.
* @return {Object[]} list of all relevent pellet update values.
*/
Pellet.update = function(){
	var data = [];
	for(var i in Pellet.list){
		var pellet = Pellet.list[i];
		pellet.update();
		if(pellet.toRemove){
			//pellet is marked for removal, remove it.
			delete Pellet.list[i];
			removeData.pellets.push(pellet.id);
			newRemoveData = true;
		}
	}
	return data;
}

/**
* Get inital data for all pellets.
* @return {Object[]} list of pellet objects for client to initalise.
*/
Pellet.getAllInitData = function() {
	var currentPellets = [];
	for (var i in Pellet.list) 
		currentPellets.push(Pellet.list[i].getInitData());
	return currentPellets;
}

/**
* Create new Hazzard object.
* @param {Object} the hazzard object values.
* @return {Object} Hazzard object.
*/
var Hazzard = function(param) {
	//Extend the entity object.
	var self = Entity(param);

	//retain super class function for overide.
	var super_update = self.update;
	
	/**
	* run update logic.
	*/
	self.update = function(){
		for(var i in Player.list){
			var player = Player.list[i];
			if(player.isEntityPositonInternal(self)){
				player.size -= config.hazzardDamage;
			}
		}
		super_update();
	}

	/**
 	* get inital data.
 	* @return {Object} required hazzard values for client to initalise hazzard.
 	*/
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

//list of all hazzards in game.
Hazzard.list = [];

/**
* Get update data for all hazzards.
* @return {Object[]} list of all relevent hazzard update values.
*/
Hazzard.update = function(){
	var data = [];
	for(var i in Hazzard.list){
		var hazzard = Hazzard.list[i];
		hazzard.update();
	}
	return data;
}

/**
* Get inital data for all hazzards.
* @return {Object[]} list of hazzards objects for client to initalise.
*/
Hazzard.getAllInitData = function() {
	var currentHazzards = [];
	for (var i in Hazzard.list) 
		currentHazzards.push(Hazzard.list[i].getInitData());
	return currentHazzards;
}


setInterval(function(){
	var noOfPellets = Object.keys(Pellet.list).length;
 	// Spawn pellets untill it meets the pellet density.
	for(i = noOfPellets; i < config.pelletDensity; i++){
		var pettelColors = config.pelletColors;
		var pelletColor = pettelColors[Math.floor(
			(Math.random() * pettelColors.length))];
		//spawn pellet at random location.
		var pellet = Pellet({
			x:Math.floor(mapWidth * Math.random()),
			y:Math.floor(mapHeight * Math.random()),
			size:config.pelletSize,
			baseColor:pelletColor,
			id:uuid.v1() //Generate a time based ID.
		});
	}

	// Spawn pellets untill it meets the hazzard density.
	var noOfHazzards = Object.keys(Hazzard.list).length;
	for(i = noOfHazzards; i < config.hazzardDensity; i++){
		//spawn hazzard in random location
		var hazzard = Hazzard({
			x:Math.floor(mapWidth * Math.random()),
			y:Math.floor(mapHeight * Math.random()),
			size:config.hazzardSize,
			baseColor:config.hazzardColor,
			id:uuid.v1() //Generate a time based ID.
		});
	}

	// Update all players and add update data for clients.
	var updateData = {players:Player.update()}
	Pellet.update();
	Hazzard.update();
	
	//emit data to clients
	for (var i in sockets) {
		var socket = sockets[i];
		if(newInitData)
			socket.emit('init',initData);
		if(newRemoveData)
			socket.emit('remove',removeData);
		if(updateData !== [])
			socket.emit('update',updateData);
	}
	//reset data.
	newInitData = false;
	newRemoveData = false;
	initData.players = [];
	initData.pellets = [];
	initData.hazzards = [];
	newRemoveData = [];
	removeData.players = [];
	removeData.pellets = [];

}, 1000 / 60); // 60 times per second.
