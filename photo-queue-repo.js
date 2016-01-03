var uuid = require('uuid');
var NodeCache = require( "node-cache" );
var queueBuilder = require('./photo-queue-builder');

if(!GLOBAL.queueCache) {
  GLOBAL.queueCache = new NodeCache( { stdTTL: 0, checkperiod: 5 } );
  GLOBAL.queueCache.on("expired", function( key, value ){
  	handleQueueItemExpiration(key, value);
  });
}

var queueCache = GLOBAL.queueCache


function saveQueue(queue) {
  queueCache.set( "queue/" + queue.name , queue);
}

function loadQueue(name) {
  return queueCache.get("queue/" + name);
}

function saveQueueItem(queueItem) {
  var expiresInMs = new Date(queueItem.expiration).getTime() - new Date().getTime();
  var expiresInSeconds = Math.floor(expiresInMs / 1000);
  console.log("Queue item expires in " + expiresInSeconds + "s.")
  queueCache.set(queueItem.id, queueItem,expiresInSeconds);
  if(!queueItem.nextQueueItemId) {
    queueCache.set(queueItem.queue + "/tail",queueItem.id);
    console.log("Set " + queueItem.queue + "/tail to " + queueItem.id);
  }
}

function loadQueueItem(queueItemId) {
  return queueCache.get(queueItemId);
}

function loadQueueTailItem(queueName) {
  var tailItem = null;
  var tailItemId = queueCache.get(queueName + "/tail");
  console.log("Tail item id = " + tailItemId);
  if(tailItemId)
    tailItem = loadQueueItem(tailItemId);

  return tailItem;
}

function handleQueueItemExpiration(key, value) {
  console.log("Item expired.  Moving along.");
  if(value.queue) {
    var queue = loadQueue(value.queue);
    if(queue) {
      if(queue.currentItem == key) {
        queue.currentItem = null;
        if(value.nextQueueItemId) {
          queue.currentItem = value.nextQueueItemId;
          console.log("Current queue item is now " + queue.currentItem);
        }
      }
      saveQueue(queue);
      queueBuilder.incrementQueue(value.queue);
    }
  }
}

module.exports.saveQueue = saveQueue;
module.exports.loadQueue = loadQueue;
module.exports.saveQueueItem = saveQueueItem;
module.exports.loadQueueItem = loadQueueItem;
module.exports.loadQueueTailItem = loadQueueTailItem;
