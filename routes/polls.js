var express = require('express');
var router = express.Router();
var passport = require('passport');
var ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn();

// Import Poll model.
var Poll = require('../models/poll.js')

function handleError(err){
console.log('Mongoose handleError:',err)
}

/* GET /polls */
router.get('/', function(req, res, next) {
console.log('GET /polls')
    Poll.find()
      .then(docs => {
            res.render('polls', {
                user: req.user,
                polls: docs
            });
        })
      .catch(err=>handleError(err));

});

/* GET /polls/:id */
router.get('/poll/:id', function(req, res, next) {
    Poll.find({
            _id: req.params.id
        })
      .then(results => {
            if (results.length > 0) {
                console.log('Poll.find:', results[0])
                const poll = results[0];
                res.render('poll', {
                    user: req.user,
                    poll: {
                        question: poll.question,
                        choices: poll.choices,
                        id: poll._id
                    }
                });
            } else {
                console.log('Poll.find')
                res.redirect('/polls');
            }
        })
      .catch(err=>handleError(err));

});

/* GET /polls/new */
router.get('/new', ensureLoggedIn, function(req, res, next) {
    res.render('new', {
        user: req.user
    });
});

/* POST /polls/new */
router.post('/new', ensureLoggedIn,  function(req, res, next) {
    const question = req.body.question;
    const keys = req.body.choices.trim().replace('\n','').split(',')
    const choices = keys.map(key=>({choice:key,votes: 0}))
    console.log(req.user)
    const userId=Number(req.user._json.sub.split('|')[1])||null;
    const poll = {
        question,
        choices,
        userId: userId,
        voters: [],
        date: Date.now()
    }
console.log(poll)
    // Save poll to database.
    Poll.create(poll, function(err, doc) {
        if (err) {
            throw err;
            res.redirect('/new');
        }
        console.log('Poll.create:', poll)
        res.redirect('/polls')
    })
});

/* UPDATE /poll/:id/vote */
router.post('/poll/:id/vote', function(req, res, next) {
    // Get poll id
    const pollId = req.params.id;
    console.log('poll id:', pollId)
    console.log(req.body)
    const selectedChoice = req.body.choices;
    const customChoice = req.body.custom;
    // Get ip address of client.
    const ip = (req.headers['x-forwarded-for'].split(',')[0]) || req.connection.remoteAddress || req.socket.remoteAddress || (req.connection.socket ? req.connection.socket.remoteAddress : null);
    console.log(ip)
    // Get poll.
    Poll.find({
            _id: pollId
        })
        .then(results => {
      const poll = results[0];
            console.log('Poll.find: '+ pollId);
   
          //   if voter ip is not in poll.voters allow user to vote
    if (!poll.voters.includes(ip)) {
        console.log('Add voter ip address to poll.voters list and register vote')
//       Add voter ip address to the poll voter list
      Poll.update(
        {_id:pollId},
        {$push: {voters: ip}},
      (err, result)=>{
      if(err){
            throw err;
            }
        console.log(`${ip} added to poll voter list.`)
      })
      
//       Get answer.
        const value = customChoice.length>0 ?customChoice : selectedChoice;
      
        // if custom vote exists add it to database
        if(customChoice){
          const choice={choice:customChoice, votes:1};
          Poll.update(
            {_id:pollId},
            {$push: {choices: choice}},
            (err, results)=>{
            if(err){
            throw err;
            }
              console.log(pollId+' was updated successfully')
            }
          )
          // Redirect to poll.
          res.redirect('/polls/poll/'+pollId)
        }else{
        //     find and increment default choice vote count.
        try {
         Poll.update( 
    {_id: pollId, 'choices.choice' : value },
    { $inc : { 'choices.$.votes' : 1}},(err, doc)=>{
            console.log('Vote successfully registered')
                      // redirect to poll
                        res.redirect('/polls/poll/'+pollId);
        })
        } 
      catch (error) {
        
          res.json({
            user: req.user,
            error: error
        });
        }
        }
    } else {
        // Response with error stating that user has already voted
      res.json({message:'User has already voted.'})
    }
        })
});

/* DELETE /poll/:id/delete */
router.get('/poll/:id/delete',ensureLoggedIn,  function(req, res, next) {
  Poll.remove({ _id: req.params.id }, function (err) {
  if (err) return handleError(err);
  // removed!
    console.log('Poll '+req.params.id+' successfully removed')
  res.redirect('/polls')
});

})

module.exports = router;