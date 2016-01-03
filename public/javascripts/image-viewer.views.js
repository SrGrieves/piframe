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
      setInterval(this.render,2000);
    },

    loadNextQueueItem: function(queueItemId) {
      console.log("Queue currently has " + this.collection.length + " item(s).  Loading next: " + queueItemId + "");

      var that = this;
      if(!queueItemId)
        throw "Tried to load null!";

      var currentQueueItem = new QueueItemModel({id: queueItemId});
      currentQueueItem.fetch({
        success: function(queueItemModel) {
          that.handleNewQueueItem(queueItemModel);
        },
        error: function(err) {
          alert("Failed to get queue item: " + err);
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
        this.pollTailItemUntilItPointsToNext();
      }
    },

    pollTailItemUntilItPointsToNext: function() {
      var that = this;
      if(!this.collection || !this.collection.length) {
        console.log("Nothing to poll anymore.  Everything must have expired.  Restarting in 30 seconds.")
        setTimeout(function() { that.initQueue(); }, 30000)
      } else if(this.collection.at(this.collection.length - 1).get("nextQueueItemId")) {
        this.loadNextQueueItem(this.collection.at(this.collection.length - 1).get("nextQueueItemId"));
      } else {
        setTimeout(function() {
          that.collection.at(that.collection.length - 1).fetch(
          {
            success: function() {
              that.pollTailItemUntilItPointsToNext();
            },
            error: function() {
              alert("Failed to reload tail item.")
            }
          });
        }, 15000);
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
        error: function(err) {
          alert("Failed to get queue: " + err.message);
        }
      });
      //this.render();
    },

    addFrameView: function(queueItemModel) {
      var view = new FrameView({model: queueItemModel, isActive: false})
      $(this.el).append(view.render().el);
      //view.fixRotation();
    },

    render: function() {
      if(this.collection && this.collection.length) {
        var topItem = this.collection.at(0);
        var expired = new Date(topItem.get("expiration")) < new Date;
        if(expired) {
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
      var photo = this.model.get("photo");
      if(photo) {
        $(this.el).html("<img />");

        var orientation = null;
        this.datetime = null;
        var that = this;
        this.$("img")[0].onload = function() {
          EXIF.getData(this, function() {
            that.datetime = EXIF.getTag(this, "DateTime");
            orientation = EXIF.getTag(this, "Orientation");
            console.log(photo.title + "(or = " + orientation + ") from "+ that.datetime);
            if(orientation == 3) {
              $(that.el).css("transform","rotate(180deg)");
            }
            else if(orientation == 6) {
              $(that.el).css("transform","rotate(90deg)");
            }
            else if(orientation == 8) {
              $(that.el).css("transform","rotate(270deg)");
            }
          });
        };


        this.$("img").attr("src",photo.file);
      } else {
        console.log("Item " + this.model.id + " is photoless.  :(");
      }

      if(this.options.isActive) {
        $(this.el).removeClass("hidden");
        $(this.el).addClass("visible");
      }

      return this;
    },

    show: function() {
      this.options.isActive = true;
      $("div.captions.left").text(this.datetime);
      $("div.captions.right").text(this.model.get("photo").title);
      $(this.el).removeClass("hidden");
      $(this.el).addClass("visible");
    },

    goAway: function() {
      $("div.captions.left").text("");
      $("div.captions.right").text("");
      this.remove();
    }

  });

  window.app = new ImageViewerAppView;

});
