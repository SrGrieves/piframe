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
  //var expiresInMs = new Date(queueItem.expiration).getTime() - new Date().getTime();
  //var expiresInSeconds = Math.floor(expiresInMs / 1000);
  //queueCache.set(queueItem.id, queueItem,expiresInSeconds);
  queueCache.set(queueItem.id, queueItem); //expiration new handled with timers at queue builder level
  if(!queueItem.nextQueueItemId) {
    queueCache.set(queueItem.queue + "/tail",queueItem.id);
    console.log("Set " + queueItem.queue + "/tail to " + queueItem.id);
  }
}

function loadQueueItem(queueItemId) {
  return queueCache.get(queueItemId);
}

function removeQueueItem(queueItemId) {
  queueCache.del(queueItemId);
}

function loadQueueTailItem(queueName) {
  var tailItem = null;
  var tailItemId = queueCache.get(queueName + "/tail");
  console.log("Tail item id = " + tailItemId);
  if(tailItemId)
    tailItem = loadQueueItem(tailItemId);

  return tailItem;
}


module.exports.saveQueue = saveQueue;
module.exports.loadQueue = loadQueue;
module.exports.saveQueueItem = saveQueueItem;
module.exports.loadQueueItem = loadQueueItem;
module.exports.removeQueueItem = removeQueueItem;
module.exports.loadQueueTailItem = loadQueueTailItem;
