var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var server = require('http').createServer(app);
var io = require('socket.io')(server); // Bind socket.io to our express server.
var ejs = require('ejs');

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('public'));

app.get('/', function(req, res){
    res.render('index');
});

// get request for section I
app.get('/sectionI', function(req, res){
    res.render('sectionI');
});

// get request for section II
app.get('/sectionII', function(req, res){
    res.render('sectionII');
});

// get request for section III
app.get('/sectionIII', function(req, res){
    res.render('sectionIII');
});

// get request for section IV
app.get('/sectionIV', function(req, res){
    res.render('sectionIV');
});

// Start the server, listening on port 3000
server.listen(3000, () => {
    console.log("Listening to requests on port 3000...");
});

const SerialPort = require('serialport'); 
const Readline = SerialPort.parsers.Readline;
const port = new SerialPort('COM3', {baudRate: 19200}); //Connect serial port to port COM4. Because my Arduino Board is connected on port COM4. See yours on Arduino IDE -> Tools -> Port
const parser = port.pipe(new Readline({delimiter: '\r\n'})); //Read the line only when new line comes.


parser.on('data', (data) => { // Read data
    var today = new Date();

    console.log(data); // print out the data

    var res = data.split(",");

    // this is the data being sent for section 1
    io.sockets.emit('data', { time: (today.getMinutes())+":"+(today.getSeconds())+":"+(today.getMilliseconds()), MF: res[0], LF: res[1], MM: res[2], HEEL: res[3], stepl: res[4], stride: res[5], cadence: res[6], spd: res[7], stepcount: res[9] });
    
    // this is the data being sent for section 3 and section 4
    //io.sockets.emit('data', {data: data});
    
    // this is the data that is sent for section two
    //io.sockets.emit('data', {MF: res[0], LF: res[1], MM: res[2], HEEL: res[3], profile: res[4]  })
});


io.on('connection', (socket) => {
    console.log("Someone connected."); //show a log as a new client connects.


    // upon client disconnect then send instruction to arduino to stop running the mode
    socket.on('disconnect', function(){
        console.log("Someone disconnected."); // show a log that a client disconnected
    });
});