var express = require('express');
var router = express.Router();
var flickrPhotos = require("../flickr-photo-loader.js");
var flickrConfig = require("../flickr.config");
var queueRepo = require("../photo-queue-repo")

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});


router.get('/API/test', function(req, res, next) {
  flickrPhotos.getSingleRandomPhoto(flickrConfig).then(function(result) {
    res.json({ number: 42, message: "Hi!.   Hi!  Hello!", photo: result});
  }, function(err) {
    res.json({ err: err});
  });
});

router.get('/API/queue/:queueName', function(req, res, next) {
    res.json(queueRepo.loadQueue(req.params.queueName));
});

router.get('/API/queueitem/:itemId', function(req, res, next) {
    res.json(queueRepo.loadQueueItem(req.params.itemId));
});

module.exports = router;
