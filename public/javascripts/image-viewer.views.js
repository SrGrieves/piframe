$(function() {

  var ImageViewerAppView = Backbone.View.extend({

    el: "div#image-viewer",

    initialize: function() {
      _.bindAll(this,"loadNextQueueItem","render","addFrameView");
      this.model = new QueueModel;
      this.collection = new Backbone.Collection;
      //this.listenTo(this.model,"sync",function() { this.loadNextQueueItem() });
      this.listenTo(this.collection,"add",this.addFrameView);
      this.initQueue();
      setInterval(this.render,5000);
    },

    loadNextQueueItem: function(queueItemId) {
      console.log("Queue current has " + this.collection.length + " item(s).  Loading next (" + queueItemId + ")");

      var that = this;
      if(!queueItemId)
        throw "Tried to load null!";

      var currentQueueItem = new QueueItemModel({id: queueItemId});
      currentQueueItem.fetch({
        success: function(queueItemModel) {
          that.handleNewQueueItem(queueItemModel);
        },
        error: function() {
          alert("Failed to get queue item.");
        }
      });
    },

    handleNewQueueItem(queueItemModel) {
      var expired = new Date(queueItemModel.get("expiration")) <= (new Date);
      if(expired || this.collection.get(queueItemModel.id))
        console.log("Skipping expired or already existing item");
      else {
        this.collection.push(queueItemModel);
      }

      if(queueItemModel.get("nextQueueItemId"))
        this.loadNextQueueItem(queueItemModel.get("nextQueueItemId"))
      else {
        console.log("Latest item appears to be the last one. Let's poll it.");
        this.pollTailItemUntilItPointsToNext();
      }
    },

    pollTailItemUntilItPointsToNext: function() {
      var that = this;
      if(!this.collection || !this.collection.length) {
        console.log("Nothing to poll anymore.  Everything must have expired.  Restarting in 30 seconds.")
        setTimeout(function() { that.initQueue(); }, 30000)
      } else if(this.collection.at(this.collection.length - 1).get("nextQueueItemId")) {
        console.log("Polling Success! Last item now has a pointer.  Loading.")
        this.loadNextQueueItem(this.collection.at(this.collection.length - 1).get("nextQueueItemId"));
      } else {
        console.log("Last queue item still doesn't have a pointer.  We'll check again in 15 seconds.");
        setTimeout(function() { that.pollTailItemUntilItPointsToNext(); }, 15000);
      }
    },

    initQueue: function() {
      var that = this;
      this.model.fetch({
        success: function() {
          queueItemId = that.model.get("currentItem");
          console.log("Start up.  Getting current queue item from queue status: " + queueItemId);
          that.loadNextQueueItem(queueItemId);
        },
        error: function() {
          alert("Failed to get queue.");
        }
      });
      //this.render();
    },

    addFrameView: function(queueItemModel) {
      var view = new FrameView({model: queueItemModel, isActive: false})
      $(this.el).append(view.render().el);
    },

    render: function() {
      console.log("Checking if any frames need updating.");
      if(this.collection && this.collection.length) {
        var topItem = this.collection.at(0);
        var expired = new Date(topItem.get("expiration")) < new Date;
        if(expired) {
          console.log("First item is expired.  Removing");
          topItem.trigger("expired");
          this.collection.remove(topItem);
          if(this.collection.length) {
            var newTopItem = this.collection.at(0);
            newTopItem.trigger("activated");
          }
        } else if($(".viewer-frame.visible").length == 0) {
          topItem.trigger("activated");
        }
      }
      return this;
    }
  });

  var FrameView = Backbone.View.extend({

    tagName: "div",
    className: "viewer-frame hidden",

    initialize: function(options) {
      $(this.el).attr("id",this.model.id);
      this.options = options;
      this.listenTo(this.model,"expired", this.goAway);
      this.listenTo(this.model,"activated", this.show);
    },

    render: function() {

      $(this.el).html("<img src=\"" + this.model.get("photo").file + "\" />");

      if(this.options.isActive) {
        $(this.el).removeClass("hidden");
        $(this.el).addClass("visible");
      }

      return this;
    },

    show: function() {
      this.options.isActive = true;
      $(this.el).removeClass("hidden");
      $(this.el).addClass("visible");
    },

    goAway: function() {
      console.log("Goodbye.");
      this.remove();
    }

  });

  window.app = new ImageViewerAppView;

});
