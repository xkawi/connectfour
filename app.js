
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path')
  , url = require('url')
  , querystring = require('querystring')
  , http = require('http')
  , btoa = require('btoa');

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('your secret here'));
  app.use(express.session());
  app.use(app.router);
  app.enable("jsonp callback");
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

// Routes

app.get('/', function(req, res) {
    res.redirect('/index.html');
});

app.get('/verify', function(req, res) {
  var _get = url.parse(req.url, true).query;
  // jsonrequest param
  var jsonrequest = (_get['jsonrequest']) ? _get['jsonrequest'] : undefined;

  // Language param, either 'py' or 'js'
  var lang = (_get['lang']) ? (_get['lang'] === 'py') ? 'python' : 'js' : 'python';
  res.jsonp({
    lang: '',
    jsonrequest: ''
  });
});

// Code verification API using GET method
app.post('/verify', function(req, res) {
  var _get = url.parse(req.url, true).query;

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

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
