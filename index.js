var adapter 		= require('../../adapter-lib.js');
var request 		= require('request');
var lastStatus		= {};
var hombot 		= new adapter("hombot");





hombot.settings.hombots.forEach(function(bot){
	lastStatus[bot.ip] = {};
});

var checkStatus = function(){
	hombot.settings.hombots.forEach(function(bot){
		request.get({
			// url:'http://' + bot.ip + ':' + bot.port + '/sites/statistics/status.html'
			url:'http://' + bot.ip + ':' + bot.port + '/status.html'
		},function( err, httpResponse, body){
			if(err){
				if(lastStatus[bot.ip].robotstate == err.code){
					hombot.log.info("Hombot (" + bot.name + ") ist nicht erreichbar!");
					return;
				}
				hombot.setVariable("hombot." + bot.name + ".status", "nicht erreichbar");
				lastStatus[bot.ip].robotstate = err.code;
				return;
			}
			var body = body.trim();
			var first = body.search('{');
			var second = body.search('}');
			try{
				var json = JSON.parse(body.slice(first -1, second +1));
			}catch(e){
				hombot.log.error("JSON kann nicht geparsed werden!");
				hombot.log.error(e);
				return;
			}

			// Keine Statusänderung
			if(lastStatus[bot.ip].robotstate == json.robotstate){
				hombot.log.info("Keine Veränderung");
				return;
			}

			var status;
			switch(json.robotstate){
				case 'BACKMOVING_INIT':
					var status = 'Auf dem Weg zur Arbeit';
					break;
				case 'WORKING':
					status = 'Arbeitet';
					break;
				case 'HOMING':
					status = 'Auf dem Heimweg';
					break;
				case 'CHARGING':
					status = 'Lädt ('+ json.battlevel +')';
					// status = "Lädt ( " + json.battlevel + " )";
					// status = "/%";
					break;
				case 'DOCKING':
					status = 'Suche die Ladestation';
					break;
				case 'STANDBY':
					status = 'Standby';
					break;
				case 'PAUSE':
					status = 'Pause';
					break;
				default:
					status = json.robotstate;
					break;
			}
			hombot.log.debug('Veränderter Status: ' + status);
			lastStatus[bot.ip] = json;

			hombot.setVariable("hombot." + json.nickname + ".status", status);			
		});
	});
}

hombot.cron("add", 12345332, hombot.settings.cron, checkStatus);
checkStatus();
// setInterval(checkStatus, hombot.settings.requesttime * 1000);