var express = require('express');
var app=express();
var server=require('http').createServer(app);
var io=require('socket.io')(server);
io.origins('*:*');

var router = express.Router();

var bodyParser=require('body-parser');
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());
//задаєм папку для статичного контенту
app.use(express.static(__dirname));
//опрацювання кореневого шляху
app.get('/',function(req,res){
res.sendFile(__dirname+'/chat.html');
})
//порт прослуховування
//app.listen(8080);
console.log('Run server!');

var cookieParser=require('cookie-parser')();
app.use(cookieParser);

var session=require('cookie-session')({keys:['secret'],
maxAge:2*60*60*1000});
app.use(session);

const passport = require('passport');
app.use(passport.initialize());
app.use(passport.session());

var ChatUser=require('./chatuser');

var LocalStrategy=require('passport-local').Strategy;
passport.use(new LocalStrategy(
    function(username,password,done){
        ChatUser.find({username:username,password:password},
        function(err,data){
            console.log("data:");
            console.log(data);
            if(data.length)
            return done(null,{id:data[0]._id,username:data[0].username});
            return done(null,false);
    })
}));

passport.serializeUser(function(user,done){
    console.log("serialize user:");
    console.log(user);
    done(null,user);
});

passport.deserializeUser(function(id,done){
    console.log("deserialize user:");
    console.log(id);
    ChatUser.find({_id:id.id},
    function(err,data){
    console.log(data);
    if(data.length==1)
    done(null,{username:data[0].username});
    });
});

var auth=passport.authenticate(
    'local',{
    successRedirect:'/',
    failureRedirect:'/login'
    });
    var myAuth=function(req,res,next){
    if(req.isAuthenticated())
    next();
    else {
    res.redirect('/login');
    }
}

//перевірка чи user автентифікований
app.get('/',myAuth);
//опрацювання кореневого шляху
app.get('/',function(req,res){
//console.log("req.user:");
        console.log("req.user:");
        console.log(req.user);
        console.log("req.session:");
        console.log(req.session);
        res.sendFile(__dirname+'/chat.html');
})

app.post('/login',auth);
    
app.get('/logout',function(req,res){
    console.log("logout");
    req.logout();
  
    res.sendFile(__dirname+'/login.html');
    
})

app.get('/login',function(req,res){
    res.sendFile(__dirname+'/login.html');
})


server.listen(8080);

io.use(function(socket, next) {
    var req = socket.handshake;
    var res = {};
    
    cookieParser(req, res, function(err) {
    if (err) return next(err);
    session(req, res, next);
    });
});

var users=[];
io.on('connection', function (socket) {

    var user=socket.handshake.session.passport.user.username;
    var pos=users.indexOf(user);
    if(pos==-1) users.push(user);
    console.log(users);
    socket.on('joinclient',function(data){
        //console.log("push");
        console.log(data);
        console.log("socket-clients:");
        console.log(Object.keys(io.sockets.sockets));
        socket.emit('joinserver',{msg:"Привіт "+user+"!", users:users});
        
        socket.broadcast.emit('joinserver',{msg:"В чат увійшов "+user, users:users});

        ChatUser.find(function(err,data){
       
            if(data.length === users.length){
                io.emit('toAllUsers', "Welcome to our chat, guys"); 
            }
        })
    })

    socket.on('sendMessage', (message) => {
        console.log(users);
        socket.broadcast.emit('sendMessage',{user:user, msg:message.text});
    });

   

});