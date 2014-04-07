var restify = require("restify");
var Firebase = require("firebase");
var requests = require("request");	
var querystring = require('querystring');
var http = require('http');

var FIREBASE_ROOT_PATH = "https://cloudcomputing.firebaseio.com/";
var rootRef = new Firebase(FIREBASE_ROOT_PATH);
var PYTHON_VERIFIER_API_ENDPOINT = "http://flask-kawi.rhcloud.com/execute";

/*======INIT AND CONFIGURING SERVER======*/
var server = restify.createServer({
	name: "cloud-connectfour"
});
//BUNDLED PLUGINS: http://mcavage.me/node-restify/#Server-API
server.use(restify.queryParser());
server.use(restify.bodyParser());
server.use(restify.CORS());

/*======LOGIN RELATED FUNCTIONS=====*/
function findByEmail(uid, fn) {
	rootRef.child(uid).once('value', function(snapshot) {
		var user = snapshot.val();
		var exists = (user !== null);
		if (exists) {
			return fn(null, snapshot.val())
		} else {
			return fn('not exist', null);
		}
	});
}

function createUser(uid, email, fn){
	//first bot
	var user = {
		'id': uid,
		"email": email,
		"bots": [
		{
			'code': "return randint(0,6)",
			'id': 0,
			'lang': "js",
			'lose': 0,
			'name': "Bot0",
			'score': 800,
			'win': 0
		}
		]
	}
	var userRef = new Firebase(FIREBASE_ROOT_PATH + "/" + uid);
	userRef.update(user); //update to firebase
	return fn(null, user);
}

/*========GAME RELATED FUNCTIONS==========*/
var game_functions = {
	checkWinner: function(board, row, column){
		var side = board[row][column];
		var max_row = board.length;
		var max_col = board[0].length;

		var total_chip = 1;
		// check vertical - top to bottom
		// move up
		for (var i = row-1; i >= 0; i--) {
			if (board[i][column] == side) {
				total_chip += 1;
			} else {
				break;
			}
		}

		// move down
		for (var i = row+1; i < max_row; i++) {
			if (board[i][column] == side) {
				total_chip += 1;
			} else {
				break;
			}
		}
 		// check winning
 		if (total_chip >= 4) {
 			return true;
 		}

		total_chip = 1; // reset
		// check horizontal - left to right
		// move left
		for (var i = column-1; i >= 0; i--) {
			if (board[row][i] == side) {
				total_chip += 1;
			} else {
				break;
			}
		}

		// move right
		for (var i = column+1; i < max_col; i++) {
			if (board[row][i] == side) {
				total_chip += 1;
			} else {
				break;
			}
		}
		// check winning
		if (total_chip >= 4) {
			return true;
		}

		total_chip = 1; // reset
		// check back slash - left top to right bottom
		// move left top
		r = row - 1;
		c = column - 1;
		while (r >= 0 && c >= 0) {
			if (board[r][c] == side) {
				total_chip += 1;
			} else {
				break;
			}

			r -= 1;
			c -= 1;
		}

		// move right bottom
		r = row + 1;
		c = column + 1;
		while (r < max_row && c < max_col) {
			if (board[r][c] == side) {
				total_chip += 1;
			} else {
				break;
			}

			r += 1;
			c += 1;
		}
		// check winning
		if (total_chip >= 4) {
			return true;
		}

		total_chip = 1; // reset
		// check forward slash - right top to left bottom
		// move right top
		r = row - 1;
		c = column + 1;
		while (r >= 0 && c < max_col) {
			if (board[r][c] == side) {
				total_chip += 1;
			} else {
				break;
			}

			r -= 1;
			c += 1;
		}

		// move left bottom
		r = row + 1;
		c = column - 1;
		while (r < max_row && c >= 0) {
			if (board[r][c] == side) {
				total_chip += 1;
			} else {
				break;
			}

			r += 1;
			c -= 1;
		}
		// check winning
		if (total_chip >= 4) {
			return true;
		}

		// no winner
		return false;
	},
	placeChip: function(board, side, column){
		for (var i = board.length-1; i >= 0; i--) {
			if (board[i][column] == '_') {
				board[i][column] = side;
				return {"row": i, "column": column};
			} 
		}
		return null;
	},
	getAllBots: function(fn){
		rootRef.once("value", function(snapshots){
			var data = snapshots.val();
			var bots = []
			for (key in data) {
				if (!data.hasOwnProperty(key)) {
					continue;//The current property is not a direct property	
				}
				var userbots = data[key]['bots'];
				for (var i = userbots.length - 1; i >= 0; i--) {
					var bot = {
						"userid": key,
						"bot": userbots[i]
					}
					bots.push(bot)
				};
			}
			return fn(bots);
		});
	},
	getUserBot: function(uid, botid, fn){
		var botsRef = new Firebase(FIREBASE_ROOT_PATH + uid + "/bots/" + botid);
		botsRef.once("value", function(snapshots){
			var userbot = {
				'userid': uid,
				'botid': 0,
				'code': '',
				'lang': '',
				'score': 0,
				'win': 0,
				'lose': 0
			}
			var data = snapshots.val();
			//console.log(data);
			if (data !== null){ //if there are bots
				userbot.botid = data.id;
				userbot.code = data.code;
				userbot.lang = data.lang;
				userbot.score = data.score;
				userbot.win = data.win,
				userbot.lose = data.lose
			}
			return fn(userbot);
		});
	},
	executeCode: function(bot, board, callback){
		var error = '';
		if (bot.lang === "python") {
			var options = {
				uri: PYTHON_VERIFIER_API_ENDPOINT,
				form: {
					"code": bot.code,
					"board": JSON.stringify(board)
				}
			}
			requests.post(options, function(err, res, body){
				if ( (err && res.statusCode != 200) || (body === 'error') ) {
					error = new Error("error");
					return callback(error);
				}
				return callback(body); //body is the index of the move
			});
		} else if (bot.lang === 'js') {
			try {
				eval('function move(board) {\n '+bot.code+' \n}');
				var result = move(board);
				var index = parseInt(result);
				//isFinite() return true if it IS integer or legal number
				if (isFinite(index)){
					if (index < 0 || index > 6) {
						error = new Error("outofbound");
						return callback(error);
					} //outofbound
					return callback(index);
				} else {
					error = new Error('non-integer');
					return callback(error); //non-integer value
				}
			} catch (err) {
				error = new Error(err);
				return callback(error);
			}
		}
	},
	initBoard: function(){
		var board = [];
		columns = 7;
		rows = 6;
		// init empty board
		for (var i = 0; i < rows; i++) {
			board.push([]);

			for (var j = 0; j < columns; j++) { 
				board[i].push('_');
			}
		}

		return board;
	},
	saveBot: function(uid, bot){
		var ref = new Firebase("https://cloudcomputing.firebaseio.com/" + uid + "/bots");
		ref.transaction(function(currentData){
			console.log(currentData);
			if (currentData !== null){
				bot.id = currentData.length
				bot.name = "Bot" + (currentData.length).toString();
				currentData.push(b);
				return currentData;
			} else {//no bot yet
				return [b];
			}
		}, function(err, committed, snapshot){
			var reply = {
				'status': 'success',
				'message': '',
				'data': snapshot
			}
			if (err) {
				reply.status = 'error';
				reply.message = 'Unable to save to Database (' + error + ")";
			} else if (!committed) {
				reply.status = 'error';
				reply.message = 'Data Saving Aborted!';
			} else {
				reply.status = 'success';
				reply.message = 'success';
			}
			return reply;
		});
	},
	updateBotScore: function(win_bot, lose_bot){
		//calculate new score for both
		var default_score = 200;
		
		var new_winner_score = win_bot.score + default_score;
		var new_loser_score = lose_bot.score + 0;

		//add or remove score depending on the constraint
		var score_diff = win_bot.score - lose_bot.score; //current score difference
		if (score_diff < -400){ // e.g. winner: 800 and loser: 1500; hence winner get more score
			new_winner_score += 100;
		} else if (score_diff > 400) {	//e.g. winner: 1500 and loser: 800; hence winner get less than default
			new_winner_score -= 100;
		}

		var success_save = {
			'win_bot': true,
			'lose_bot': true
		}
		
		//update winner score and win stat
		var winRef = new Firebase("https://cloudcomputing.firebaseio.com/" + win_bot.userid + "/bots/" + win_bot.botid);
		winRef.update({'score': new_winner_score}, function(error){
			//console.log("error in updating winner score: ", error);
		});
		winRef.child('win').transaction(function(currentData){
			if (currentData !== null){
				return currentData + 1;
			} else {
				return currentData;
			}
		}, function(err, committed, snapshot){
			if (err) {
				console.log('Unable to save to Database (' + err + ")");
				success_save.win_bot = false;
			} else if (!committed) {
				console.log('Updating Score Aborted!',committed, err);
				success_save.win_bot = false;
			} else {
				console.log('success');
				success_save.win_bot = true;
			}
		}, false);
		//update loser score and lose stat
		var loseRef = new Firebase("https://cloudcomputing.firebaseio.com/" + lose_bot.userid + "/bots/" + lose_bot.botid);
		loseRef.update({'score': new_loser_score}, function(error){
			//console.log("error in updating winner score: ", error);
		});
		loseRef.child('lose').transaction(function(currentData){
			if (currentData !== null){
				return currentData + 1;
			} else {
				return currentData;
			}
		}, function(err, committed, snapshot){
			if (err) {
				console.log('Unable to save to Database (' + err + ")");
				success_save.win_bot = false;
			} else if (!committed) {
				console.log('Updating Score Aborted!',committed, err);
				success_save.win_bot = false;
			} else {
				console.log('success');
				success_save.win_bot = true;
			}
		}, false);

		if (success_save.win_bot && success_save.lose_bot){
			return true;
		} else {
			return false;
		}
	},
	compareBot: function(a, b){
		//used to sort bots base on the score
		if(a.bot['score'] > b.bot['score']) return -1;
		if(a.bot['score'] < b.bot['score']) return 1;
		return 0;
	},
	saveWinBot: function(bot){
		var ref = new Firebase("https://cloudcomputing.firebaseio.com/winning_bots");
		var b = {
			"code": bot.code,
			"lang": bot.lang
		}
		ref.push(b);
	}
}


/*=========FUNCTIONS FOR ALL THE ROUTES===========*/
function index(req, res, next) {
	game_functions.getAllBots(function(bots){
		res.json(bots);
	});
}

function login(req, res, next) {
	//email = req.params['email'];
	userid = req.params['userid']; //change to fbid
	//console.log(email, username, req.params)
	if (userid){
		// check if user exists
		findByEmail(userid, function(err, user){
			// if user does not exist
			if (err && !user) {
        		// create user and save to firebase
        		createUser(userid, email, function(err, user){
        			if (err) {
        				res.send(err);
        			} else {
        				res.json(user);
        			}
        		});
        	} else { //else if exist return the user
        		res.json(user);
        	}
        });
	} else {
		res.json({"error": "missing username or email"});
	}
}

function leaderboard(req, res, next) {
	//get list of bots (all) and sort it base on the score
	//the ELO score is applied during the score updating while playing
	game_functions.getAllBots(function(result){
		result.sort(game_functions.compareBot);
		console.log(result);
		res.json(result);
	});
}

function submit_bot(req, res, next) {
	bot = req.params['bot']; // move function in text (example of value: 'return Math.floor((Math.random()*7))' )
	lang = req.params['lang']; // programming language (example: 'js')
	user_id = req.params['userid']; // get user userid

	success = false;
	code = '';
	tests = '';
	verified_results = '';

	// validate python
	if (lang == 'python') {
		code = 'def move(board):\n  '+bot;
		tests = ">>> move('WHATEVER')\n  'ANYTHING'\n";
	} else { // validate javascript
		code = 'function move(board) {\n '+bot+' \n}';
		tests = "assert_equal('ANYTHING', move([[]]))";
	}

	jsonrequest = {
		"solution": code,
		"tests": tests
	}

	// prepare data for verifier
	var json_data = querystring.stringify({
		jsonrequest : JSON.stringify(jsonrequest)
	});

	// configure verifer settings
	var options = {
		host : '162.222.183.53',
		path : '/' + lang,
		method : 'POST',
		headers : {
			'Content-Type' : 'application/x-www-form-urlencoded',
			'Content-Length' : json_data.length
		}
	};

    // create HTTP request
    var request = http.request(options, function(response) {
    	// Handle data received
    	response.on('data', function(chunk) {
    		verified_results += chunk.toString();
    	});

        // process returned data
        response.on("end", function() {
        	result = JSON.parse(verified_results);
        	// invalid syntax
        	if (result['errors'] != null && result['errors'] != '') {
        		success = false;
        		res.json({"success": success, "error": "invalid syntax"});
        	}

        	move = result['results'][0]['received'];
        	
        	// check move result validity
        	if (parseInt(move) >= 0 && parseInt(move) <= 6) {
        		success = true;

        		// valid move, therefore
        		// save to db if bot exists
        		// otherwise update and save a revision
        		var b = {
        			'code': code,
        			'id': 0,
        			'lang': lang,
        			'name': "Bot0",
        			'score': 800,
        			'win': 0,
        			'lose': 0
        		}
        		game_functions.saveBot(user_id, b);
        		res.json({"success": success, "error": null, "bot": b});
        	} else {
        		res.json({"success": false, "error": "bot cause invalid move"});
        	}
        	
        });
	}).on('error', function(e) {
		console.log("Got error: " + e.message);
	});

    // send HTTP request
    request.write(querystring.stringify({
    	jsonrequest : JSON.stringify(jsonrequest)
    }));
    request.end();
}

function play(req, res, next) {
	//bot1 = req.params['bot1'];
	//bot2 = req.params['bot2'];
	var form = {
		'bot1': {
			'userid': 'kawi',
			'botid': 1
		},
		'bot2': {
			'userid': 'bob',
			'botid': 0
		}
	}
	game_functions.getUserBot(form.bot1['userid'], form.bot1['botid'], function(b1){
		var bot1 = b1;
		console.log('bot1: ', bot1);
		game_functions.getUserBot(form.bot2['userid'], form.bot2['botid'], function(b2){
			var bot2 = b2;
			console.log('bot2:', bot2);

			// create empty board, a 2D array
			var board = game_functions.initBoard(); //7x6
			// init counter
			var count = 1;
			// assign chips
			var bot1_chip = 'R'; // bot1 will have Red chip - R
			var bot2_chip = 'W'; // bot2 will have White chip - W
			// winning tracker
			var end_game = false;
			var result = {};
			var steps = [];
			var move = -1;

			// first move
			var board_in_string = "";
			for (var i = 0; i < board.length; i++) {
				for (var j = 0; j < board[i].length; j++) {
					board_in_string += (board[i][j]+",");
				}
				board_in_string += '\n';
			}
			steps.push(board_in_string);

			//this is more effective than while loop
			(function game() {
				
				var bot, side, chip;
				if (!end_game) {
					side = '';
					if (count%2 == 1){		//odd, bot1's turn
						bot = bot1;
						side = bot1_chip;
					} else {				//even, bot2's turn
						bot = bot2;
						side = bot2_chip;
					}
					game_functions.executeCode(bot, board, function(index){
						try {
							if (index instanceof Error){
								throw new Error('badmove');	//throw an error if bad move is detected
							} else {
								move = index;
							}

							// place the chip with the move index
							chip = game_functions.placeChip(board, side, move);

							//uncomment to see the game play on the server's terminal (local computer)
							console.log("round: ", count, "\tPlayer/Side: ", side, "\tmove:", move);
							console.log("board: \n", board);

							// update board
							board[chip['row']][chip['column']] = side;

							// add step
							var board_in_string = "";
							for (var i = 0; i < board.length; i++) {
								for (var j = 0; j < board[i].length; j++) {
									board_in_string += (board[i][j]+",");
								}
								board_in_string += '\n';
							}
							steps.push(board_in_string);

							// check winning
							end_game = game_functions.checkWinner(board, chip['row'], chip['column']);

							if (end_game) {
								//update_score(winner_bot, loser_bot);
								if (count%2 == 1) {
									result.winner = bot1.userid;
									result.bad_move = null;
									game_functions.updateBotScore(bot1, bot2);
									game_functions.saveWinBot(bot1);
								} else { //			
									result.winner = bot2.userid;
									result.bad_move = null;
									game_functions.updateBotScore(bot2, bot1);
									game_functions.saveWinBot(bot2);
								}
							}
							count += 1;
							game();
						} catch (err) {							//catch the bad move error and stop the game
							result.winner = '';
							result.bad_move = count%2 == 1 ? 'bot1' : 'bot2';
							end_game = true;
							console.log("game interupted with bad move:", err.message);
							game();
						}
					});
				} else {
		    		// add steps to result
		    		result['steps'] = steps;
					// return game result
					res.send(result);
				}
			}()); //end function game()
		});
	});	
}

//DEFINE ROUTES
server.get('/index', index);
server.get('/leaderboard', leaderboard);
server.post('/login', login);
server.post('/submit_bot', submit_bot);
server.get('/play', play);

//ONE UNIT TESTING FOR THE ENTIRE APP USING TRAVIS-CL
server.get('/test', function(req, res, next){
	res.send(200, 'success');
})

//SERVE STATIC/PUBLIC FILE
server.get('/', restify.serveStatic({
	directory: './public',
	default: 'index.html'
}));

//RUN APPLICATION
var port = process.env.PORT || 5000;
server.listen(port, function() {
	console.log("Listening on " + port);
});
module.exports = server