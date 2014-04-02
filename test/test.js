var app = require('../server'), http = require('http'), request = require('supertest'), assert = require('assert');

describe('GET /test', function(){
  it('get test', function(done){
    request(app)
      .get('/test')
      .expect(200, done);
  });
});