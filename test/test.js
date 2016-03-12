var assert = require('chai').assert;
var request = require('request');

var root = 'http://localhost:3000/api';

describe('Main Test Suite', () => {

  var huntId;

  describe('addHunt()', () => {
    it('should be able to add a new hunt with correct values', (done) => {
      var opts = {
        uri: `${root}/hunt`,
        method: 'POST',
        json: {
          category: "viihde-elektroniikka",
          exclude: "barfoo, maxfoo",
          hasPrice: true,
          include: "Foobar",
          location: "uusimaa",
          maxPrice: 500,
          title: "Foobar"
        }
      };
      request(opts, (err, resp, body) => {
        assert.equal(1, body.result.ok);
        done();
      });
    });
  });

  describe('getHunt()', () => {
    it('should be able to list the hunts', (done) => {
      var opts = {
        uri: `${root}/hunt`,
        json: true
      };
      request(opts, (err, resp, body) => {
        assert.equal(1, body.length);
        assert.equal(2, body[0].filters.exclude.length);
        huntId = body[0]._id;
        done();
      });
    });
  });

  describe('deleteHunt()', () => {
    it('should most likely work', (done) => {
      var opts = {
        uri: `${root}/hunt/${huntId}`,
        method: 'DELETE',
        json: true
      };
      request(opts, (err, resp, body) => {
        assert.equal(1, body.n);
        done();
      });
    });
  });
});
