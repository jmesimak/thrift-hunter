'use strict';
var Crawler = require('./app/Crawler');
var config = require('./config.json');
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;
var fs = require('fs');
var mailer = require('./app/mailer/mailer');

app.use(express.static('front'));
app.use(bodyParser.json())

function hunt(db, res) {
  var collection = db.collection('hunt');
  collection.find().toArray(function(err, hunts) {
    var promises = [];
    var matches = {};
    hunts.forEach(function(hunt) {
      var c = new Crawler(hunt.searchParams, hunt.filters);
      promises.push(c.findMatches().then(function(success) {
        console.log(`Compsing entry for ${success.length} matches`);
        var doc = {
          keyword: hunt.keyword,
          matches: success
        };
        var collection = db.collection('hunt');
        var hrefs = hunt.matches.map((m) => { return m.href }).concat(hunt.deleted);
        success = success.filter((match) => {
          return hrefs.indexOf(match.href) === -1 ? true : false;
        });
        console.log(`After filtering there are ${success.length} matches`);
        if (success.length > 0) {
          mailer.sendMatches(hunt, success);
        }
        matches[hunt.title] = success;
        console.log(`Hunted for ${hunt.title} and found ${success.length} matches`);
        collection.update({_id: hunt._id}, {$pushAll: {matches: success}}, function(err, result) {
        });
      }));
    });
    Promise.all(promises)
      .then(function(success) {
        if (res) {
          res.json(matches);
        }
      });
  });
}

MongoClient.connect(config.mongoUri, function(err, db) {

  app.listen(config.port, function() {
    app.post('/api/hunt', function(req, res) {
      var collection = db.collection('hunt');
      var filters = {
        include: req.body.include.split(', '),
        exclude: req.body.exclude ? req.body.exclude.split(', ') : [],
        maxPrice: req.body.maxPrice,
        hasPrice: req.body.hasPrice
      };
      var searchParams = {
        location: req.body.location,
        category: req.body.category
      };
      var hunt = {
        title: req.body.title,
        matches: [],
        deleted: [],
        searchParams: searchParams,
        filters: filters
      };
      collection.insert(hunt, function(err, result) {
        res.json(result);
      });
    });

    app.get('/api/hunt', function(req, res) {
      var collection = db.collection('hunt');
      collection.find().toArray(function(err, items) {
        items.forEach(function(i) {
          i.matches = i.matches.filter(function(m) { return i.deleted.indexOf(m.href) === -1});
        });
        res.json(items);
      });
    });

    /*
    * Deleted: Array of hrefs that match to items which are not to be shown.
    */
    app.put('/api/hunt/:huntId/match/retire', function(req, res) {
      let collection = db.collection('hunt');
      let huntId = req.params.huntId;
      collection.update({"_id": new ObjectId(huntId)}, {$push: {deleted: req.body.deleted}},
        function(err, result) {
          res.json(result);
      });
    });

    app.delete('/api/hunt/:huntId', function(req, res) {
      let collection = db.collection('hunt');
      collection.remove({"_id": new ObjectId(req.params.huntId)}, function(err, result) {
        res.json(result);
      });
    });

    app.put('/api/hunt/:huntId/match/favorite', function(req, res) {
      let collection = db.collection('hunt');
      console.log(`updating ${req.params.huntId} with ${req.body.href} to true`);
      collection.update(
        {"matches.href": req.body.href},
        {"$set": {"matches.$.favorite": req.body.favorite}},
        function(error, result) {
          res.json(result);
        }
      );
    });

    app.get('/api/manual-search', function(req, res) {
      hunt(db, res);
    });

  });
});
