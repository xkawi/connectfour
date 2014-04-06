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
function findByEmail(uid, email, fn) {
	rootRef.child(uid).once('value', function(snapshot) {
		var user = snapshot.val();
		var exists = (user !== null);
		if (exists && user.email === email) {
			return fn(null, snapshot.val())
		} else {
			return fn(null, null);
		}
	});
}

function createUser(uid, email, fn){
	//first bot
	var user = {
		"email": email,
		"bots": []
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
			if (board[i][column] == '') {
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
	getUserBots: function(uid, fn){
		var botsRef = new Firebase(FIREBASE_ROOT_PATH + uid + "/bots");
		botsRef.once("value", function(snapshots){
			var data = snapshots.val();
			if (data !== null){ //if there are bots
				return fn(data);
			} else {
				return fn(new Array());
			}
		})
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
				board[i].push('');
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
		//win_bot.userid + /bots + win_bot.id + /score
	}

}


/*=========FUNCTIONS FOR ALL THE ROUTES===========*/
function index(req, res, next) {
	game_functions.getAllBots(function(bots){
		res.json(bots);
	});
}

function login(req, res, next) {
	email = req.params['email'];
	fbid = req.params['fbid']; //change to fbid
	//console.log(email, username, req.params)
	if (email && fbid){
		// check if user exists
		findByEmail(fbid, email, function(err, user){
			if (err) { res.send(err); }
			// if user does not exist
			if (!user) {
        		// create user and save to firebase
        		createUser(fbid, email, function(err, user){
        			if (err) { res.send(err); }
        			res.json(user);
        		});
        	}
        	// create session, how?
        	res.json(user);
        });
	} else {
		res.json({"error": "missing username or email"});
	}
}

function leaderboard(req, res, next) {
	// get list of bots with proper sorting based on ELO
	bots = []

	// return bots
	res.send(bots);
}

/*function execute_code(req, res, next){
	//pass code and board
	// 'return Math.floor((Math.random()*7))'
	var bot = {
		'user_id': 'kawi',
		'code': 'return randint(0,6)',
		'id': 1,
		'lang': 'python'
	}
	var board = game_functions.initBoard();
	//console.log('board: ', board);
	//console.log('bot: ', bot);
	var move = '';
	game_functions.executeCode(bot, board, function(result){
		try {
			if (result instanceof Error){
				move = 'bad move';
				throw new Error('bad move');
			} else {
				move = result;
				console.log('move inside callback and if in execute_code: ', move);
			}
			console.log("result instanceof error: ", result instanceof Error);
			console.log('typeof result:', typeof result);
			//move = result;
			res.send(200, move);
		} catch (err) {
			res.send(200, 'badmove');
			console.log('bad move detected');
		}
	});
	
	//console.log('move outside callback: ', move);
	//res.send(200, move);
}*/

function submit_bot(req, res, next) {
	bot = req.params['bot']; // move function in text
	lang = req.params['lang']; // programming language
	user_id = req.params['fb_id']; // get user fb_id
	//user_id = 'kawi';
	//lang = 'js';
	//bot = 'return Math.floor((Math.random()*7))';
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
        		res.send(200, {"success": success, "error": "invalid syntax"});
        	}

        	move = result['results'][0]['received'];
        	console.log("move here: ", move);
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
        	}
        	res.send(200, {"success": success});
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
	//bot1 = req.params['bot1']; //expected sample: { id: 0, lang: python, code: asdasd}
	//bot2 = req.params['bot2'];
	//expected data;
	bot1 = {
		'userid': 'kawi',
		'code': 'return randint(0,6)',
		'id': 1,
		'lang': 'python'
	}
	bot2 = {
		'userid': 'bob',
		'code': 'return randint(0,6)',
		'id': 0,
		'lang': 'python'
	}
	
	// create empty board, a 2D array
	board = game_functions.initBoard(); //7x6
	// init counter
	count = 1;
	// assign chips
	bot1_chip = 'R'; // bot1 will have Red chip - R
	bot2_chip = 'W'; // bot2 will have White chip - W
	// winning tracker
	end_game = false;
	result = {};
	steps = [];
	move = -1;

	// first move
	steps.push(board);
	//this is more effective than while loop
	(function game() {
		if (!end_game) {
	        side = '';
			if (count%2 == 1){		//odd, bot1's turn
				bot = bot1;
				side = bot1_chip;
			} else {				//even, bot2's turn
				bot = bot2;
				side = bot2_chip;
			}
			//Execute Code for both Python and JS code
			game_functions.executeCode(bot, board, function(index){
				try {
					if (index instanceof Error){
						throw new Error('badmove');			//throw an error if bad move is detected
					} else {
						move = index;
					}
					// place the chip with the move index
					chip = game_functions.placeChip(board, side, move);
					//console.log("round: ", count, "\tPlayer/Side: ", side, "\tmove:", move);
					//console.log("board: \n", board);
					// update board
					board[chip['row']][chip['column']] = side;

					// add the board to steps array
					steps.push(board);

					// check winning
					end_game = game_functions.checkWinner(board, chip['row'], chip['column']);

					if (end_game) {
						//TODO: update_score(winner_bot, loser_bot);
						if (count%2 == 1) {
							result.winner = 'bot1';
						} else { //			
							result.winner = 'bot2';
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
			result.steps = steps;
			console.log(result);
			// return game result
			res.send(result);
    	}
	}()); //end function game()
}

function get_user_bots(req, res, next){
	console.log(req.query);
	var uid = req.query["userid"];
	if (uid){
		game_functions.getUserBots(uid, function(bots){
			res.send(200, bots);
		});
	} else {
		res.send(200, {"error": true, "message": "missing userid parameter"});
	}
}

// routes
server.get('/index', index);
server.get('/leaderboard', leaderboard);
server.post('/login', login);
server.post('/submit_bot', submit_bot);
server.get('/play', play);

//for debug purpose
server.get('/execute_code', execute_code);
server.get('/user_bots', get_user_bots)
//to ensure that the test pass, if fail means something is wrong with the server
//and travis will notify us
server.get('/test', function(req, res, next){
	res.send(200, 'success');
})

//SERVE STATIC/PUBLIC FILE
server.get('/', restify.serveStatic({
	directory: './public',
	default: 'index.html'
}));

//ANOTHER WAY OF HANDLING THE ROUTING
//var PATH = '/votes';
//server.get({path: '/'}, respond);
//server.get({path: PATH+'/res', version: '0.0.1'}, respond);
//server.post({path: PATH+'/init', version: '0.0.1'}, init_db);
//server.get('/', respond);

// run 
var port = process.env.PORT || 5000;
server.listen(port, function() {
	console.log("Listening on " + port);
});
module.exports = server