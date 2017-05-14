
function Chat() {};

var selfId;
var socket;
var input = document.getElementById('chatInput');
var ul = document.getElementById('chatMessageList');

Chat.prototype.handleNetwork = function(socket) {

	this.socket = socket;

  	socket.on('newMessage', function({sender,message}){
  		newMessage = sender + ': ' + message;
  		li = document.createElement("li");
  		li.appendChild(document.createTextNode(newMessage));
  		ul.appendChild(li);
  		//set scroll to bottom.
  		ul.scrollTop = ul.scrollHeight;
  	});

  	socket.on('anouncement',function(anouncement){
  		message = 'Server: ' + anouncement;
  		li = document.createElement("li");
  		li.appendChild(document.createTextNode(message));
  		ul.appendChild(li);
  	});

  	socket.on('disconnect',function(){
  		while (ul.hasChildNodes()) {   
    		ul.removeChild(ul.firstChild);
		}
  	});

	input.addEventListener('keypress', function (event) {
        if (event.keyCode === 13) { // enter key pressed
            var message = input.value;
			socket.emit('globalMessage',{senderId: selfId, message:message});
			input.value = [];
        }
    });
}