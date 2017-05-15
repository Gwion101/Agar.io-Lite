function Leaderboard() {};

var socket;
var leaderboardList = document.getElementById('leaderboardList');

Leaderboard.prototype.handleNetwork = function(socket) {

	this.socket = socket;

  	socket.on('update',function({players}){
  		//clear the leaderboard.
  		while (leaderboardList.hasChildNodes()) {
    		leaderboardList.removeChild(leaderboardList.firstChild);
		}
		//order players by size.
		var leaderboard = players.slice(0);
		leaderboard.sort(function(a,b) {
    		return b.size - a.size;
		});
		//list each player on the leaderboard.
		for(var i = 1; i <= leaderboard.length; i++){
			li = document.createElement("li");
			var name = leaderboard[i-1].name;
  			li.appendChild(document.createTextNode(i + ":" + name));
  			leaderboardList.appendChild(li);
		}
  	});
}