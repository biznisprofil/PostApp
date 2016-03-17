var mongoose = require('mongoose');

var Schema = mongoose.Schema;

// Kreiramo šemu za postove korisnika
var StorySchema = new Schema({
    
    creator: { type: Schema.Types.ObjectId, ref: 'User' },
    content: String,
    created: { type: Date, default: Date.nov }   
});

module.exports = mongoose.model('Story', StorySchema);