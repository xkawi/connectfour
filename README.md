# connectfour

connectfour app for cloud computing.

Once pushed, Travis-Cl will automatically deploy it to Heroku.

[Configure Travis-Cl for Node+Heroku](http://shapeshed.com/continuously-deploy-node-apps-with-github-travis-and-heroku/) or [this](http://xseignard.github.io/2013/02/18/continuous-deployement-with-github-travis-and-heroku-for-node.js/)


# API Docs

### GET /index

**Request**: nil

**Response**: Array of bots in JSON format

	[
		{
			'userid': '123114125545345',
			'bot': {
				'id': 0,
				'code': 'return Math.floor(Math.random()*7);',
				'name': 'Bot0',
				'lang': 'js',
				'score': 800,
				'win': 2,
				'lose': 1
			}
		},
		{
			'userid': '19823712364987',
			'bot': {
				'id': 0,
				'code': 'return randint(0, 6)',
				'name': 'Bot0',
				'lang': 'js',
				'score': 800,
				'win': 0,
				'lose': 0
			}
		}
	]

### POST /login

**Request**:

x-www-form-urlencoded

```
email - the email that the user type in (or facebook email)

userid - can be the facebook ID of the user or any unique string
```

**Response**:

New User (example)
	
	{
		id: "the fbid being sent"
		email: "hello@hello.com,
		bots: [
			{
				code: "return randint(0,6)"
				id: 0
				lang: "js"
				lose: 0
				name: "Bot0"
				score: 800
				win: 0
			}
		]
	}
	
Existing User (example)

	{
		id: 123,
		email: "hello@hello.com"
		bots: [
			{
				code: "return Math.floor(Math.random()*6);"
				id: 1
				lang: "js"
				lose: 0
				name: "Bot1"
				score: 800
				win: 0
			},
			{
				code: "return randint(0,6)"
				id: 2
				lang: "python"
				lose: 10
				name: "Bot2"
				score: 800
				win: 11
			}
		]	
	}


### GET /leaderboard

**Request**: nil

**Response**: Array of bots with its respective userid in JSON format


	[
		{
			"userid":"bob",
	 		"bot": {
	 			"code": "return randint(0,6)",
	 			"id":0,
	 			"lang":"python",
	 			"lose":11,
	 			"name":
	 			"anotherUser's Bot",
	 			"score":1000,
	 			"win":11
	 		}
	 	},
		{
			"userid": "1234567",
			"bot": {
				"code":"return randint(0,6)",
				"id":0,
				"lang":"js",
				"lose":0,
				"name":"Bot0",
				"score":800,
				"win":0
			}
		},
		{
			"userid":"kawi",
			"bot": {
				"code":"return randint(0,6)",
				"id":2,
				"lang":"python",
				"lose":10,
				"name":"Bot2",
				"score":800,
				"win":11
			}
		},
		{
			"userid":"kawi",
			"bot": {
				"code":"return Math.floor(Math.random()*6);",
				"id":1,
				"lang":"js",
				"lose":0,
				"name":"Bot1",
				"score":800,
				"win":0
			}
		}
	]


### POST /submit_bot

**Request**: 

x-www-form-urlencoded

	bot - the actual code of the bot without method definition
	lang - the code language (only 2 possible value: 'python' or 'js')
	userid - the user id (also called facebook ID) of the bot

**Response**:

Syntax Error (JSON):

	{"success": false, "error": "invalid syntax"}
	
Bad Move (JSON):

	{"success": false, "error": "bot cause invalid move"}

Success (JSON):

	{
		"success": true,
		"error": null,
		"bot": {
			'code': code,
			'id': 0,
			'lang': lang,
			'name': "Bot0",
			'score': 800,
			'win': 0,
			'lose': 0
		}
    }


### POST /play

**Request**: 

x-www-form-urlencoded (converted into JSON format)

*bot1*
	
	{
		'userid': 'kawi',
		'code': 'return Math.floor(Math.random()*7);',
		'botid': 1,
		'lang': 'js',
		'score': 800
	}
	
*bot2*

	{
		'userid': 'bob',
		'code': 'return randint(0,6)',
		'botid': 0,
		'lang': 'python',
		'score': 800
	}
	

**Response**:

	{
	"winner":"bot2",
	"steps":[
		[
			["","","","","","",""],
			["","","","","","",""],
			["W","","","","","",""],
			["R","","R","","","",""],
			["W","W","W","W","R","",""],
			["W","R","R","R","W","","R"]
		],
		[
			["","","","","","",""],
			["","","","","","",""],
			["W","","","","","",""],
			["R","","R","","","",""],
			["W","W","W","W","R","",""],
			["W","R","R","R","W","","R"]
		],
		[
			["","","","","","",""],
			["","","","","","",""],
			["W","","","","","",""],
			["R","","R","","","",""],
			["W","W","W","W","R","",""],
			["W","R","R","R","W","","R"]
		],
		[
			["","","","","","",""],
			["","","","","","",""],
			["W","","","","","",""],
			["R","","R","","","",""],
			["W","W","W","W","R","",""],
			["W","R","R","R","W","","R"]
		],
		[
			["","","","","","",""],
			["","","","","","",""],
			["W","","","","","",""],
			["R","","R","","","",""],
			["W","W","W","W","R","",""],
			["W","R","R","R","W","","R"]
		],
		[
			["","","","","","",""],
			["","","","","","",""],
			["W","","","","","",""],
			["R","","R","","","",""],
			["W","W","W","W","R","",""],
			["W","R","R","R","W","","R"]
		],
		[
			["","","","","","",""],
			["","","","","","",""],
			["W","","","","","",""],
			["R","","R","","","",""],
			["W","W","W","W","R","",""],
			["W","R","R","R","W","","R"]
		],
		[
			["","","","","","",""],
			["","","","","","",""],
			["W","","","","","",""],
			["R","","R","","","",""],
			["W","W","W","W","R","",""],
			["W","R","R","R","W","","R"]
		],
		[
			["","","","","","",""],
			["","","","","","",""],
			["W","","","","","",""],
			["R","","R","","","",""],
			["W","W","W","W","R","",""],
			["W","R","R","R","W","","R"]
		],
		[
			["","","","","","",""],
			["","","","","","",""],
			["W","","","","","",""],
			["R","","R","","","",""],
			["W","W","W","W","R","",""],
			["W","R","R","R","W","","R"]
		],
		[
			["","","","","","",""],
			["","","","","","",""],
			["W","","","","","",""],
			["R","","R","","","",""],
			["W","W","W","W","R","",""],
			["W","R","R","R","W","","R"]
		],
		[		
			["","","","","","",""],
			["","","","","","",""],
			["W","","","","","",""],
			["R","","R","","","",""],
			["W","W","W","W","R","",""],
			["W","R","R","R","W","","R"]
		],
		[
			["","","","","","",""],
			["","","","","","",""],
			["W","","","","","",""],
			["R","","R","","","",""],
			["W","W","W","W","R","",""],
			["W","R","R","R","W","","R"]
		],
		[
			["","","","","","",""],
			["","","","","","",""],
			["W","","","","","",""],
			["R","","R","","","",""],
			["W","W","W","W","R","",""],
			["W","R","R","R","W","","R"]
		],
		[
			["","","","","","",""],
			["","","","","","",""],
			["W","","","","","",""],
			["R","","R","","","",""],
			["W","W","W","W","R","",""],
			["W","R","R","R","W","","R"]
		]
	]
	}