
function Chat(application) {
	app = application;
};

var app;
var selfId = '';
var socket;
var input = document.getElementById('chatInput');
var ul = document.getElementById('chatMessages');

Chat.prototype.handleNetwork = function(socket) {

	this.socket = socket;

  	socket.on('newMessage', function(data){
  		message = data.sender + ': ' + data.message;
  		li = document.createElement("li");
  		li.appendChild(document.createTextNode(message));
  		ul.appendChild(li);
  	});

  	socket.on('anouncement',function(data){
  		message = 'Server: ' + data.anouncement;
  		li = document.createElement("li");
  		li.appendChild(document.createTextNode(message));
  		ul.appendChild(li);
  	});

	input.addEventListener('keypress', function (event) {
        if (event.keyCode === 13) { // enter key pressed
            var message = input.value;
			socket.emit('globalMessage',{senderId: selfId, message:message});
			input.value = [];
        }
    });
}