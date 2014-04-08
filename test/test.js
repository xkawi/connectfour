var app = require('../server'), http = require('http'), request = require('supertest'), assert = require('assert');

describe('GET /test', function(){
  it('get test', function(done){
    request(app)
      .get('/test')
      .expect(200, done);
  });
});

describe('POST /submit_bot', function(){
  it('should return error', function(done){
  	request(app)
  	  .post('/submit_bot')
  	  .set('Content-Type', 'application/json')
  	  .send({ bot: 'return 1/0', lang: 'js', userid: "1234" })
  	  .set('Accept', 'application/json')
  	  .expect({"success": false, "error": "bot cause invalid move"}, done);
 });
});