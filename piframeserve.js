var flickrPhotos = require("./flickr-photo-loader.js");
var flickrConfig = require("./flickr.config");

flickrPhotos.getRandomPhoto(flickrConfig).then(function(result) {
  console.log(result); // "Stuff worked!"
}, function(err) {
  console.log(err); // Error: "It broke"  
});


var express = require('express');
var app = express();

app.get('/', function (req, res) {
  res.send('Hello World!');
});

var server = app.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});
