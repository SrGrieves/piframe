var express = require('express');
var router = express.Router();
var flickrPhotos = require("../flickr-photo-loader.js");
var flickrConfig = require("../flickr.config");
var queueRepo = require("../photo-queue-repo")

router.get('/queue/:queueName', function(req, res, next) {
  var queue = queueRepo.loadQueue(req.params.queueName);
  if(!queue)
    res.status(404).send('Not found');
  else
    res.json(queue);
});

router.get('/queueitem/:itemId', function(req, res, next) {
  var queueItem = queueRepo.loadQueueItem(req.params.itemId);
  if(!queueItem)
    res.status(404).send('Not found');
  else
    res.json(queueItem);
});

module.exports = router;
