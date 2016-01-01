var express = require('express');
var router = express.Router();
var flickrPhotos = require("../flickr-photo-loader.js");
var flickrConfig = require("../flickr.config");
var queueRepo = require("../photo-queue-repo")

router.get('/queue/:queueName', function(req, res, next) {
    res.json(queueRepo.loadQueue(req.params.queueName));
});

router.get('/queueitem/:itemId', function(req, res, next) {
    res.json(queueRepo.loadQueueItem(req.params.itemId));
});

module.exports = router;
