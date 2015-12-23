
var importantStuff = {};
var _ = require("underscore");
var https = require('https');
var fs = require('fs');

function getRandomPhoto(flickrOptions) {
  var Flickr = require("flickrapi");

  Flickr.authenticate(flickrOptions, function(error, flickr) {
    importantStuff.flickr = flickr;
    flickr.photos.getCounts({ dates:[0,new Date().getTime()]}, function(err, result) {
      importantStuff.totalNumberOfPhotos = result.photocounts.photocount[0].count;
      getAPicture();
    });
  });
}


function getAPicture() {
  var randomPhotoNumber = Math.floor(Math.random() * importantStuff.totalNumberOfPhotos);
  importantStuff.flickr.photos.search({
    user_id: importantStuff.flickr.options.user_id,
    authenticated: true,
    per_page: 1,
    page: randomPhotoNumber
  }, handleSearchResult);
}

function handleSearchResult(err, searchResult) {
  console.log("Fetching photo with titled \"" + searchResult.photos.photo[0].title + "\".");
  importantStuff.flickr.photos.getSizes({
    user_id: importantStuff.flickr.options.user_id,
    authenticated: true,
    photo_id: searchResult.photos.photo[0].id
  }, function(err, sizesResult) { handleGetSizesResult(err,sizesResult,searchResult.photos.photo[0].id); });
}

function handleGetSizesResult(err,result, photoId) {
  var originalPhoto = _.findWhere(result.sizes.size, { label: "Original"});
  if(originalPhoto.media != "photo") {
    console.log("Landed on a video.  That's bad.");
    process.exit(1);
  } else {
    var fileStream = fs.createWriteStream(photoId + ".jpg");
    fileStream.on('finish', function () { console.log("Done."); process.exit(); });
    var request = https.get(originalPhoto.source, function(response) {
      response.pipe(fileStream);
    });
  }
}

module.exports.getRandomPhoto = getRandomPhoto;
