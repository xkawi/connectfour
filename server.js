var restify = require("restify");
var Firebase = require("firebase");
var request = require("request");	
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
	executeJsBot: function(botcode, board, fn){
		//return integer or the index of the next move
		//return null for value/result if have error
		try {
			eval(botcode);
			var result = play_game(board);
			var tryParseToInt = parseInt(result)
			if (isFinite(tryParseToInt)){ //isFinite() return true if it IS integer or legal number
				if (tryParseToInt < 0 || tryParseToInt > 6) { return fn("outofbound", null); } //outofbound
				//CHECK WHETHER THE INT REPLACE AN EXISTING PLAYER: NEED STRUCTURE OF THE BOARD
				return fn(null, tryParseToInt);
			} else {
				return fn("error", null); //non-integer value
			}
		} catch(err) {
			return fn(err.message, null);
		}
	},
	executePyBot: function(botcode, board, fn){
		var options = {
			form: { "code": botcode, "board": board }
		}
		request.post( PYTHON_VERIFIER_API_ENDPOINT, options, function (err, res, body) {
			if (err && res.statusCode != 200) { return fn(err, body); }
			////CHECK WHETHER THE INT REPLACE AN EXISTING PLAYER
			if (body == "error" || body == "-1"){
				return fn("error", body);
			}
			return fn(null, body);
		});
	},
	verifyCode: function(botcode, board, lang, fn){
		if (lang === "js"){
			this.executeJsBot(botcode, board, function(err, result){
				//if got err and result is null value
				if(err && !result){ return fn(err, result); } 
				return fn(null, result);
			});
		} else if (lang === "py") {
			this.executePyBot(botcode, board, function(err, result){
				if (err) { return fn(err, result) }
				if (!err){ return fn(null, result) }
			});
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
	saveBot: function(uid, bot_code, bot_id){
		//fb_id/bots/bot_id
		//bot_id = length of bots array + 1
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

function verify_code(req, res, next){
	//pass code and board
	var code = req.params['code'];
	var board = req.params['board'];
	var lang = req.params['lang'];
	game_functions.verifyCode(code, board, lang, function(err, result){
		if (err) { res.json({"error": true, "message": err, "result": result}); }
		res.json({"error": false, "message": err, "result": result});
	})
}

function submit_bot(req, res, next) {
	bot = req.params['bot']; // move function in text
	lang = req.params['lang']; // programming language
	user_id = req.params['fb_id']; // get user fb_id
	
	success = false;
	code = '';
	tests = '';
	verified_results = '';

	// validate python
	if (lang == 'python') {
		code = 'def move(baord):\n  '+bot;
		tests = ">>> move('WHATEVER')\n  'ANYTHING'\n";
	} else { // validate javascript
		code = 'function move(baord) {\n '+bot+' \n}';
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
        	move = result['results'][0]['received'];

        	// check move result validity
        	if (parseInt(move) >= 0 && parseInt(move) <= 6) {
        		success = true;

        		// valid move, therefore
        		// save to db if bot exists

        		// otherwise update and save a revision

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
	bot1 = req.params['bot1'];
	bot2 = req.params['bot2'];

	//board = [][]; //7x6

	// get the two bots from db

	// create empty board, a 2D array

	// init counter
	count = 1;
	// assign chips
	bot1_chip = 'R'; // bot1 will have Red chip - R
	bot2_chip = 'W'; // bot2 will have White chip - W
	// winning tracker
	has_winner = false;
	result = {};
	steps = [];
	move = -1;

	while (!has_winner) {
		// odd, bot1's turn
		if (count%2 == 1) {
			// run bot1's bot with current board
			// get the move index	

		} else { // even, bot2's turn
			// run bot2's bot with current board 			
			// get the move index

		}

		// place the chip with the move index

		// update board

		// add the board to steps array

		// check winning
		// if bot1 wins
			// result['winnder'] = 'bot1';
		// else if bot2 wins
			// result['winnder'] = 'bot2';
		// else
			// it is a draw
			// result['winnder'] = null;
			count += 1;
		}

	// add steps to result
	result['steps'] = steps;

	// return game result
	res.send(result);
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
server.post('/play', play);

//for debug purpose
server.post('/verify_code', verify_code);
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