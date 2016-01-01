$(function() {

  var ImageViewerAppView = Backbone.View.extend({

    el: "div#image-viewer",

    initialize: function() {
      _.bindAll(this,"loadNextQueueItem","render");
      this.model = new QueueModel;
      this.collection = new Backbone.Collection;
      this.listenTo(this.model,"sync",function() { this.loadNextQueueItem() });
      //this.listenTo(this.collection,"add",this.render);
      this.initQueue();
    },

    loadNextQueueItem: function(queueItemId) {
      console.log("Getting queue items.");
      if(!queueItemId && this.collection.length == 0)
        queueItemId = this.model.get("currentItem");
      else if(!queueItemId && this.collection.at(this.collection.length - 1).get("nextQueueItemId"))
        queueItemId = this.collection.at(this.collection.length - 1).get("nextQueueItemId");

      var that = this;
      if(queueItemId) {
        var currentQueueItem = new QueueItemModel({id: queueItemId});
        currentQueueItem.fetch({
          success: function(queueItemModel) {
            var expired = new Date(queueItemModel.get("expiration")) <= (new Date);
            if(!expired)
              that.collection.push(queueItemModel);
            else {
              console.log("Skipping expired item");
            }
            if(queueItemModel.get("nextQueueItemId"))
              that.loadNextQueueItem(queueItemModel.get("nextQueueItemId"))
            else {
              console.log("Got to the end of it. We'll check again in a minute.");
              setTimeout(function() { that.loadNextQueueItem(); }, 2000);
            }
          },
          error: function() {
            alert("Failed to get queue item."); }});
            setTimeout(function() {
              that.initQueue();
            }, 2000);
      } else {
        console.log("No queue item to load.");
        setTimeout(function() {
          that.initQueue();
        }, 30000);
      }
    },

    initQueue: function() {
      this.model.fetch({
        error: function() {
          alert("Failed to get queue.");
        }
      });
      //this.render();
    },

    render: function() {
      clearTimeout(this.frameRefreshTimerId);
      console.log("Checking on queue stuff.")
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
        this.frameRefreshTimerId = setTimeout(this.render,2000);
      }
      return this;
    }
  });

  var FrameView = Backbone.View.extend({

    tagName: "div",
    className: "viewer-frame hidden",

    initialize: function(options) {
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
