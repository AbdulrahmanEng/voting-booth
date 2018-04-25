const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const PollSchema = new Schema({
 question: {type: String, requred:true},
 choices: {type: Array, requred:true},
 date: {type:Date, required: true},
 userId: {type:Number, required: true},
voters: {type:Array, required: true}
});

const Poll = mongoose.model('Poll', PollSchema);

module.exports=Poll;