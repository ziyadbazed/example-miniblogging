console.time('StartServer');
console.time('requireLib');
var express	= require('express'),
    ejs		= require('ejs'),
    mongo	= require('mongoskin'),
    db		= mongo.db('localhost:27017/twit?auto_reconnect'),
    port	= 8089;
console.timeEnd('requireLib');


console.time('InitializeServer');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);

app.configure(function(){
    app.engine('.html', ejs.__express);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'html');
    app.set('view options', {layout: false});
    app.use(app.router);
    app.use(express.bodyParser());
    app.use(express.cookieParser());
    app.use(express.session({secret: 'asdfa fasd'}));
    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(express.methodOverride());
    app.use(express.cookieParser());
    var oneYear = 31557600000;
    app.use(express.static(__dirname + '/public'), { maxAge: oneYear });
});

app.configure('development', function() {
	app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function() {
	app.use(express.errorHandler());
});
console.timeEnd('InitializeServer');
    
app.get('/', function(req, res, next) {
	db.collection('post').find({}, {limit:50, sort:[['date', -1]]}).toArray(function (error, posts) {
		if (error) {
			console.error(error);
		}
		res.render('newsfeed', {data: posts});
	});
});

io.sockets.on('connection', function (socket) {
  socket.on('post', function (data) {
    db.collection('post').save({text: data.text, date: new Date()}, function(err, result) {
		if (err) {
			console.error(err);
		} else {
			socket.broadcast.emit('feed', {data: result});
		}
    });
  });
});

//Start the server
server.listen(port);
console.log('Server started at port: ', port);
console.timeEnd('StartServer');