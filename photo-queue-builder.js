var flickrPhotos = require("./flickr-photo-loader.js");
var flickrConfig = require("./flickr.config");
var uuid = require('uuid');
var queueRepo = require("./photo-queue-repo")

function initializeQueue(name) {

  var currentQueueItemId = incrementQueue(name);
  var i = 0;
  while(i < 10) {
    incrementQueue(name);
    i++;
  }

  var queue = {
    name: name,
    currentItem: currentQueueItemId,
    size: 0
  };

  queueRepo.saveQueue(queue);
}

function incrementQueue(queueName) {
  var incrementId = -1;
  console.log("Adding photo to tail end of queue \"" + queueName + "\"");
  var tailItem = queueRepo.loadQueueTailItem(queueName);
  if(tailItem) {
    incrementId = addRandomPhotoToQueue(queueName,tailItem.id);
  } else {
    console.log("No tail.  Assuming new queue");
    incrementId = addRandomPhotoToQueue(queueName);
  }
  return incrementId;
}

function trimQueue(queueName) {
  console.log("Removing first item of queue");
  var queue = queueRepo.loadQueue(queueName);
  if(queue) {
    var currentItemId = queue.currentItem;
    var currentItem = queueRepo.loadQueueItem(currentItemId);
    queue.currentItem = currentItem.nextQueueItemId;
    queueRepo.removeQueueItem(currentItemId);
    if(currentItem.photo)
      flickrPhotos.deleteFile(currentItem.photo.id);
    queueRepo.saveQueue(queue);
    incrementQueue(queueName);
  }
}

function addRandomPhotoToQueue(queueName, previousItemId) {

  var displaySeconds = 10;

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

  var expiresIn = new Date(newQueueItem.expiration).getTime() - new Date().getTime();
  loadQueueItemPhoto(newQueueItem.id);
  setTimeout(function() { trimQueue(queueName)}, expiresIn);
  return newQueueItem.id;
}

function loadQueueItemPhoto(queueItemId) {
  flickrPhotos.getSingleRandomPhoto(flickrConfig).then(
    function(result) {
      var queueItem = queueRepo.loadQueueItem(queueItemId);
      if(queueItem && queueItem.status == "loading") {
        queueItem.photo = result;
        queueItem.status = "ready";
        queueRepo.saveQueueItem(queueItem);
      } else {
        console.log("Queue item " + queueItemId + " missing");
      }
    },
    function(err) {
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
module.exports.incrementQueue = incrementQueue;
