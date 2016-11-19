var adapter 		= require('../../adapter-lib.js');
var request 		= require('request');
var lastStatus		= {};
var hombot 		= new adapter({
	"name": "Hombot",
	"loglevel": 3,
	"description": "Speichert den Status eines LG-Hombot mit Wlan-Hack: roboterforum.de",
	"settingsFile": "hombot.json"
});





hombot.settings.hombots.forEach(function(bot){
	lastStatus[bot.ip] = {};
});

var checkStatus = function(){
	hombot.settings.hombots.forEach(function(bot){
		request.get({
			url:'http://' + bot.ip + ':' + bot.port + '/status.html'
		},function( err, httpResponse, body){
			if(err){
				hombot.log.error("Hombot (" + bot.name + ") ist nicht erreichbar!");
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
					status = 'Lädt';
					break;
				case 'DOCKING':
					status = 'Docke an';
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
// setInterval(checkStatus, hombot.settings.requesttime * 1000);