var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/API/test', function(req, res, next) {
  res.json({ number: 42, message: "Hi!.   Hi!"});
});

module.exports = router;
