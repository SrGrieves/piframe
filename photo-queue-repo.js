var uuid = require('uuid');
var NodeCache = require( "node-cache" );

if(!GLOBAL.queueCache)
  GLOBAL.queueCache = new NodeCache();

var queueCache = GLOBAL.queueCache


function saveQueue(queue) {
  queueCache.set( "queue/" + queue.name , queue);
}

function loadQueue(name) {
  return queueCache.get("queue/" + name);
}

function saveQueueItem(queueItem) {
  queueCache.set(queueItem.id, queueItem);
}

function loadQueueItem(queueItemId) {
  return queueCache.get(queueItemId);
}

module.exports.saveQueue = saveQueue;
module.exports.loadQueue = loadQueue;
module.exports.saveQueueItem = saveQueueItem;
module.exports.loadQueueItem = loadQueueItem;
