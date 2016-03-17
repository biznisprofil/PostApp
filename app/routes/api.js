var User = require('../models/user'); // Pozivamo user schemu koju smo napravili
var Story = require('../models/story');
var config = require('../../config'); // Pozivamo bazu i ključ za logovanje

var secretKey = config.secretKey;

var jsonwebtoken = require('jsonwebtoken');

function createToken(user) {
    
    var token = jsonwebtoken.sign({
        id: user._id,
        name: user.name,
        username: user.username
    }, secretKey, {
        expirtesInMinute: 1440
    });
    
    return token;
    
}

module.exports = function(app, express) {
    
    var api = express.Router();
    
    api.post('/signup', function(req, res) {
        //req.body je body-parser pomocu kog pristupamo podacima koje korisnik unosi u signup page
        var user = new User({ 
            name: req.body.name,
            username: req.body.username,
            password: req.body.password
            
        });
        
        // Funkcija koja podatke korisnika prikupljene iz gornje fun. body-parsera unosi u bazu podataka
        user.save(function(err) {
            if(err) {
              res.send(err);
                return;
            }  
            
            res.json({ message: 'User has been created!' });
        });
        
    });
    
    
    // Funkcija za prikazivanje svih korisnika u bazi
    api.get('/users', function(req, res) {
        
        User.find({}, function(err, users) {
            if(err) {
                res.send(err);
                return;
            }
            
            res.json(users);
        });
        
    });

    // Funkcija koja traži specifičan objekat u bazi, služimo za login korisnika
    api.post('/login', function(req, res) {
        
        User.findOne({ 
            username: req.body.username
        }).select('password').exec(function(err, user) {
            
            if(err) throw err;
            
            if(!user) {
                
                res.send({ message: "User doesnt exist" });
            } else if(user){
                
                var validPassword = user.comparePassword(req.body.password);
                // funkcija upoređuje šifru korisnika definisali smo je u user.js
                
                if(!validPassword) {
                    res.send({ message: "Invalid Password" });
                } else {
                    
                   /// dodeljujemo token korisniku koji se ulogovao
                    var token = createToken(user);
                    
                    res.json({
                        success: true,
                        message: "Succesfuly login!",
                        token: token
                    });                    
                }
            }            
        });       
    });
    
    api.use(function(req, res, next) {
        
        console.log("Somebody just come to our app!");
        
        var token = req.body.token || req.param('token') || req.headers['x-access-token'];
        
        // Proverava da li je korisniku dodeljen token, da li je korisnik ulogovan ili ne
        if(token) {
            
            jsonwebtoken.verify(token, secretKey, function(err, decoded) {
                
                if(err) {
                    res.status(403).send({ success: false, message: "Failed to authenticate user" });
                    
                    
                } else {
                    
                    //
                    req.decoded = decoded;
                    
                    next();                    
                }                
            });           
        } else {           
            res.status(403).send({ succes: false, message: "No Token Provided"});           
        }                  
    });
    
    
    // Destination B // proverava da li je token legitiman
    
    api.route('/')
        // Ukoliko je token legitiman ulogovani korisnik može da objavi post.
        .post(function(req, res) {
        
        var story = new Story({            
            creator: req.decoded.id,
            content: req.body.content,                                    
        });
        
        story.save(function(err) {
            if(err) {
                res.send(err);
                return
            }
            
            res.json({message: "New Story Created"});
        });       
    }) 
    
    // Funkcija prikazuje postove koje je korisnik objavio
    .get(function(req, res) {
        
        Story.find({ creator: req.decoded.id }, function(err, stories) {
            
            if(err) {
                res.send(err);
                return;
            }
            
            res.json(stories);
        });            
    });
    
    api.get('/me', function(req, res) {
        res.json(req.decoded);
    });
    
    return api        
}