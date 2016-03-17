var mongoose = require('mongoose');

var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');

// mongoose schema za smestanje korisnikovih podataka
var UserSchema = new Schema({
    
    name: String,
    username: { type: String, required: true, index: { unique: true }},
    password: { type: String, required: true, select: false}
});

// Funkcija za hashovanje passworda
UserSchema.pre('save', function(next) {
    
    var user = this;
    
    if(!user.isModified('password')) return next();
    
    bcrypt.hash(user.password, null, null, function(err, hash) {
        if(err) return next(err);
        
        user.password = hash;
        next();
    });
});

// Pomoću ove funkcije upoređuje se unos korisnika sa šiform korisnika iz baze
UserSchema.methods.comparePassword = function(password) {
    
    var user = this;
    
    return bcrypt.compareSync(password, user.password);
}

// pomoću ovoga kreiramo mogućnost da iz drugog fajla koristimo shemu koju smo upravo napravili
module.exports = mongoose.model('User', UserSchema);