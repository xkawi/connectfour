/*
JAVASCRIPT: CONVERT STRING TO FUNCTION AND EXECUTE IT
eval("function play_game(board,side) {\n  return board.replace('_',side);\n}")
var board = "_______________"
var side = "X"
play_game(board, side)
> "X______________"

default function for javascript:
function play_game(board):
	return Math.floor(Math.random()*6);
}

def play_game(board):
	return randint(0,6) #inclusive
	

colIsFull
PYTHON: EXECUTE PYTHON STRING CODE
exec "code string"


hitting of homepage
login
new sign up
bots submission (click submit bot)
time spent on time
# of play (click play)


When a player's actual tournament scores exceed his expected scores, the Elo system takes this as evidence that player's rating is too low, and needs to be adjusted upward. Similarly when a player's actual tournament scores fall short of his expected scores, that player's rating is adjusted downward. Elo's original suggestion, which is still widely used, was a simple linear adjustment proportional to the amount by which a player overperformed or underperformed his expected score. The maximum possible adjustment per game, called the K-factor, was set at K = 16 for masters and K = 32 for weaker players.
Supposing Player A was expected to score E_A points but actually scored S_A points. The formula for updating his rating is
R_A^\prime = R_A + K(S_A - E_A).

https://github.com/hugodias/EloRating-JavaScript/blob/master/src/elo_rating.js



GAMEPLAY:
Is move valid: result is not int; if int, is it 0 to 6?

Play:
Counter for player
Constant var for board
While no winner n board not full: Check syntax: Check js or py n if return not integer; error;
Place the coin
Check winning
Stop when someone win or stack is full

/
Return list of players n boards

Select bot or random

/leaderboard
Research on scoring system

Python Web service to execute python code;

Structure:
Player:
- firebase auth
- bot: lang, code,

Check whether the chess score tight to user or bot


app.post('/verify', function(req, res) {

	// jsonrequest param
	var jsonrequest = (req.body['jsonrequest']) ? req.body['jsonrequest'] : undefined;

	// Language param, either 'py' or 'js'
	var lang = (req.body['lang']) ? (req.body['lang'] === 'py') ? 'python' : 'js' : 'python';

	if (lang && jsonrequest) {
        var json_data = querystring.stringify({
          jsonrequest : JSON.stringify(jsonrequest)
        });
        var options = {
          host : 'ec2-54-251-204-6.ap-southeast-1.compute.amazonaws.com',
          path : '/' + lang,
          method : 'POST',
          headers : {
            'Content-Type' : 'application/x-www-form-urlencoded',
            'Content-Length' : json_data.length
          }
        };
        var verified_results = '';

        // Call the HTTP request
      var request = http.request(options, function(response) {
        // Handle data received
        response.on('data', function(chunk) {
          verified_results += chunk.toString();
        });
        // Send the json response
        response.on("end", function() {
          res.jsonp(JSON.parse(verified_results));
        });
      }).on('error', function(e) {
        console.log("Got error: " + e.message);
      });

      // Write jsonrequest data to the HTTP request
      request.write(querystring.stringify({
        jsonrequest : JSON.stringify(jsonrequest)
      }));
      request.end();
	} else {
        res.jsonp({
            error: 'Please check parameters!'
        });
	}
});





*/