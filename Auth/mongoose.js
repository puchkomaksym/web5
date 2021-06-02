var mongoose = require('mongoose');
mongoose.Promise = global.Promise;
mongoose.connect('mongodb+srv://romchick:123@cluster0.unuad.mongodb.net/myFirstDatabase?retryWrites=true&w=majority', { useNewUrlParser: true });
mongoose.set('useFindAndModify', false);
console.log("mongodb connect...")
module.exports = mongoose;