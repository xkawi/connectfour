var restify = require("restify");
var Firebase = require("firebase");

var FIREBASE_ROOT_PATH = "https://cloudcomputing.firebaseio.com/";
var rootRef = new Firebase(FIREBASE_ROOT_PATH);

/*======INIT AND CONFIGURING SERVER======*/
var server = restify.createServer({
	name: "cloudcomputing-project"
});
//BUNDLED PLUGINS: http://mcavage.me/node-restify/#Server-API
server.use(restify.queryParser());
server.use(restify.bodyParser());
server.use(restify.CORS());

/*======LOGIN RELATED FUNCTIONS=====*/
function findByEmail(username, email, fn) {
	rootRef.child(username).once('value', function(snapshot) {
		var user = snapshot.val();
		var exists = (user !== null);
		if (exists && user.email === email) {
			return fn(null, snapshot.val())
		} else {
			return fn(null, null);
		}
	});
}

function createUser(username, email, fn){
	var user = {
		"email": email,
		"bot": {
			"id": username + "bot",
			"name": username + "'s Bot",
			"code": "def play_game(board):\n\treturn true",
			"lang": "py",
			"score": 1000
		}
	}
	var userRef = new Firebase(FIREBASE_ROOT_PATH + "/" + username);
	userRef.update(user); //update to firebase
	return fn(null, user);
}

/*========GAME RELATED FUNCTIONS==========*/
var game_functions = {
	checkWinner: function(board, side){
		//algo goes here
	},
	placeToBoard: function(board, side){

	},
	getAllBots: function(fn){
		rootRef.once("value", function(snapshots){
			var data = snapshots.val();
			var bots = []
			for (key in data) {
				if (!data.hasOwnProperty(key)) {
					continue;//The current property is not a direct property	
				}
				var bot = {
					"username": key,
					"bot": data[key]['bot']
				}
			    //console.log(bot);
			    bots.push(bot)
			}
			return fn(bots);
		});
	},
	executeJsBot: function(botcode, lang, board){
		//return integer or the index of the next move
		//return null if have error
		eval("function play_game(board,side) {\n  return board.replace('_',side);\n}")
		var board = "_______________"
		var side = "X"
		play_game(board, side)
		//> "X______________"
	},
	initBoard: function(){
		return [][];
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
	username = req.params['username'];
	//console.log(email, username, req.params)
	if (email && username){
		// check if user exists
		findByEmail(username, email, function(err, user){
			if (err) { res.send(err); }
			// if user does not exist
			if (!user) {
        		// create user and save to firebase
        		createUser(username, email, function(err, user){
        			if (err) { res.send(err); }
        			res.json(user);
        		});
        	}
        	// create session, how?
        	res.json(user);
        });
	} else {
		res.json({"error": "missing username or email");
	}
}

function leaderboard(req, res, next) {
	// get list of bots with proper sorting based on ELO
	bots = []

	// return bots
	res.send(bots);
}

function submit_bot(req, res, next) {
	bot = req.params['bot']; // move function in text
	lang = req.params['lang']; // programming language

	// get user id from session

	// validate syntax & validate valid move

		// if lang == 'python'
			// call API to python app
			// check whether it returns int
		// else
			// run the unit testing here

	// if passes validations
		// save to db if there's no existing bot
		// update db if there is existing bot

		// send true

	// else
		// send false

	res.send(true); // to be removed
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

// routes
server.get('/index', index);
server.get('/leaderboard', leaderboard);
server.post('/login', login);
server.post('/submit_bot', submit_bot);
server.post('/play', play);
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