const mongoose = require('mongoose');

const groupchatSchema = new mongoose.Schema({
    sender_id:{
        type:mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    group_id:{
        type:mongoose.Schema.Types.ObjectId,
        ref: 'Group'
    },
    message:{
        type:String,
        required: true
    }
},
{timestamps:true});

module.exports = mongoose.model('groupChat', groupchatSchema)