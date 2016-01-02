$(function() {

  var ImageViewerAppView = Backbone.View.extend({

    el: "div#image-viewer",

    initialize: function() {
      _.bindAll(this,"loadNextQueueItem","render","addFrameView");
      this.model = new QueueModel;
      this.collection = new Backbone.Collection;
      this.listenTo(this.model,"sync",function() { this.loadNextQueueItem() });
      this.listenTo(this.collection,"add",this.addFrameView);
      this.initQueue();
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
      console.log("Checking if any frames need updating.")
      if(this.collection && this.collection.length > 0) {
        var noFrameDisplayed = $(".viewer-frame").length == 0;
        if(noFrameDisplayed) {
          console.log("No frame on display.  Let's start things up.")
          var view = new FrameView({model: this.collection.at(0), isActive: true})
          $(this.el).append(view.render().el);
        } else {
          var frameShouldBeUpdated = new Date(this.collection.at(0).get("expiration")) <= (new Date);
          if(frameShouldBeUpdated)
            console.log("Expired!");
          var frameCanBeUpdated = this.collection.length > 1;
          if(frameShouldBeUpdated && frameCanBeUpdated) {
            console.log("Removing");
            var expiredItem = this.collection.at(0)
            this.collection.remove(expiredItem);
            expiredItem.trigger("expire");

            var view = new FrameView({model: this.collection.at(0), isActive: true})
            $(this.el).append(view.render().el);
          }
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
      this.listenTo(this.model,"expire", this.remove)
    },

    render: function() {

      $(this.el).html("<img src=\"" + this.model.get("photo").file + "\" />");

      if(this.options.isActive)
        $(this.el).removeClass("hidden");

      return this;
    }

  });

  window.app = new ImageViewerAppView;

});
