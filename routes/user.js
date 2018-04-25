//
// This sets up the route for when a user is logged, which uses `ensureLoggedIn`. This uses
// the `connect-ensure-login` middleware for Express that integrates with Passport.js. 
//

var express = require('express');
var passport = require('passport');
var ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn();
var router = express.Router();

// Import Poll model.
var Poll = require('../models/poll.js')

function handleError(err){
console.log('Mongoose handleError:',err)
}

/* GET /user. */
router.get('/', ensureLoggedIn, function(req, res, next) {
  console.log('GET /user')
  const userId=Number(req.user._json.sub.split('|')[1])||null;
  Poll.find({userId:userId},(err, docs)=>{
    if (err) handleError(err)
    console.log('Poll.find:', docs)
    //   Get polls with userId of req.user
  res.render('user', { user: req.user,  polls: docs });
  })
});

module.exports = router;
