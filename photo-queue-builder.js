var flickrPhotos = require("./flickr-photo-loader.js");
var flickrConfig = require("./flickr.config");
var uuid = require('uuid');
var queueRepo = require("./photo-queue-repo")

function initializeQueue(name) {

  var currentQueueItemId = addRandomPhotoToQueue(name);
  var i = 0;
  var nextQueueItemId = currentQueueItemId;
  while(i < 5) {
    nextQueueItemId = addRandomPhotoToQueue(name,nextQueueItemId);
    i++;
  }

  var queue = {
    name: name,
    currentItem: currentQueueItemId
  };

  queueRepo.saveQueue(queue);
}


function addRandomPhotoToQueue(queueName, previousItemId) {

  var displaySeconds = 30;

  var newQueueItem = {
    id: uuid.v4(),
    status: "loading",
    expiration: new Date((new Date).getTime() + (displaySeconds * 1000)),
    queue: queueName,
    photo: null,
    nextQueueItemId: null
  };

  if(previousItemId) {
    var previousItem = queueRepo.loadQueueItem(previousItemId);
    previousItem.nextQueueItemId = newQueueItem.id;
    newQueueItem.expiration = new Date(previousItem.expiration.getTime() + (displaySeconds * 1000));
    queueRepo.saveQueueItem(previousItem);
  }

  queueRepo.saveQueueItem(newQueueItem);
  loadQueueItemPhoto(newQueueItem.id);

  return newQueueItem.id;
}

function loadQueueItemPhoto(queueItemId) {
  flickrPhotos.getSingleRandomPhoto(flickrConfig).then(function(result) {
    var queueItem = queueRepo.loadQueueItem(queueItemId);
    if(queueItem && queueItem.status == "loading") {
      queueItem.photo = result;
      queueItem.status = "ready";
      queueRepo.saveQueueItem(queueItem);
    } else {
      console.log("Queue item " + queueItemId + " missing");
    }
  }, function(err) {
    var queueItem = queueRepo.loadQueueItem(queueItemId);
    if(queueItem && queueItem.status == "loading") {
      queueItem.status = "failed";
      queueItem.error = err;
      queueRepo.saveQueueItem(queueItem);
    } else {
      console.log("Queue item " + queueItemId + " missing");
    }
  });
}

module.exports.initializeQueue = initializeQueue;
module.exports.addRandomPhotoToQueue = addRandomPhotoToQueue;
