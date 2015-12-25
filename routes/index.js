var express = require('express');
var router = express.Router();
var flickrPhotos = require("../flickr-photo-loader.js");
var flickrConfig = require("../flickr.config");

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});


router.get('/API/test', function(req, res, next) {
  flickrPhotos.getRandomPhoto(flickrConfig).then(function(result) {
    res.json({ number: 42, message: "Hi!.   Hi!  Hello!", photo: result});
  }, function(err) {
    res.json({ err: err});
  });
});

module.exports = router;
