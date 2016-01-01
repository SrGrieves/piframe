$(function() {
  window.QueueModel = Backbone.Model.extend({
    url: function() {
      return "/API/queue/default";
    }
  });
});

$(function() {
  window.QueueItemModel = Backbone.Model.extend({
    url: function() {
      return "/API/queueitem/" + this.id;
    }
  });
});
