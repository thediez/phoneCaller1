"use strict"
// This is the server-side file of our mobile remote controller app.
// It initializes socket.io and a new express instance.
// Start it by running 'node app.js' from your terminal.


// Creating an express server

var express = require('express'),
    app = express();
var bodyParser = require('body-parser');
// This is needed if the app is run on heroku and other cloud providers:

var port = process.env.PORT || 5000;

// Initialize a new socket.io object. It is bound to 
// the express app, which allows them to coexist.

var io = require('socket.io').listen(app.listen(port));


// App Configuration

// Make the files in the public folder available to the world
app.use(express.static(__dirname + '/public'));

// This is a secret key that prevents others from opening your presentation
// and controlling it. Change it to something that only you know.

var socketList = [];
var id;
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.get('/', function (req, res) {
    res.render('index.ejs', {});
});

app.get('/candidateTable.ejs', function (req, res) {
    // var conString = "postgres://postgres:Radius123@10.0.0.4:5432/hh_resume";
    var conString = "postgres://postgres:Radius123@109.188.79.65:5432/hh_resume";
    var pg = require('pg');
    var client = new pg.Client(conString);
    client.connect();
    const query = client.query('SELECT json_agg(*) FROM public.resume', (err, result) => {
        res.render('candidateTable.ejs', {candidates: result.rows[0].json_agg});
    })
});
app.get('')
app.get('/profile.ejs', function (req, res) {
    res.render('profile.ejs', {candidates: null});
});

// Initialize a new socket.io application
var presentation = io.on('connection', function (socket) {
    console.log("client connected: " + socket.id);
    socket.emit('checkIfAndroid', true);
    socket.on('checkIfAndroid', function (flag) {
        if(flag == true){
            socketList.push(socket.id);
        }
    });
    socket.on('getNextPhone', function (count) {
        var conString = "postgres://postgres:Radius123@109.188.79.65:5432/hh_resume";
        // var conString = "postgres://postgres:Radius123@10.0.0.4:5432/hh_resume";
        var pg = require('pg');
        var client = new pg.Client(conString);
        client.connect();
        const query = client.query('SELECT * FROM public.resume WHERE w_sign = 0', (err, res) => {
            console.log(res.rows[count].name);
            socket.emit('getPhone', {
                "phoneNumber": res.rows[count].telephone,
                "name": res.rows[count].name,
                "age": res.rows[count].age,
                "location": res.rows[count].addrLocation,
                "salary": res.rows[count].salary,
                "skills": res.rows[count].key_level,
                "lenght": res.rows.length
            })
        })
        // client.close(); //TODO wtf how it works with promises ???? обработчик ошибок
    });
    socket.on('audio', function (im){
        console.log(im);
        console.log("ffff");
    });

    socket.on('showCalling', function(incomingNumber){
        console.log(incomingNumber.toString());
        var conString = "postgres://postgres:Radius123@109.188.79.65:5432/hh_resume";
        // var conString = "postgres://postgres:Radius123@10.0.0.4:5432/hh_resume";
        var pg = require('pg');
        var client = new pg.Client(conString);
        client.connect();
        const query = client.query('SELECT * FROM public.resume WHERE telephone = ' + incomingNumber, (err, res) => {

        })
    });

    socket.on('callCandidate', function (candidateId) {
        // var conString = "postgres://postgres:Radius123@10.0.0.4:5432/hh_resume";
        var conString = "postgres://postgres:Radius123@109.188.79.65:5432/hh_resume";
        var pg = require('pg');
        var client = new pg.Client(conString);
        client.connect();
        const query = client.query('SELECT * FROM public.resume WHERE id = ' + candidateId, (err, res) => {
            socket.to(socketList[0]).emit('callServer', {
                "phoneNumber": res.rows[0].telephone,
            })
        })
    })

    // Clients send the 'slide-changed' message whenever they navigate to a new slide.
    socket.on('message', function (buttonId) {
        if (buttonId.indexOf("info") >= 0) {
            id = buttonId.substring(5);
            var conString = "postgres://postgres:Radius123@109.188.79.65:5432/hh_resume";
            // var conString = "postgres://postgres:Radius123@10.0.0.4:5432/hh_resume";
            var pg = require('pg');
            var client = new pg.Client(conString);
            client.connect();
            const query = client.query('SELECT * FROM public.resume WHERE id = ' + id, (err, result) => {
                app.get('/profile.ejs', function (req, res) {
                    res.render('profile.ejs', {candidates: result.rows});
                })
            });
        } else if (buttonId.indexOf("call") >= 0) {
            id = buttonId.substring(5);
            console.log(id);
        } else if (buttonId.indexOf("comment") >= 0) {
            id = buttonId.substring(8);
            console.log(id);
        }
    });

    socket.on('slide-changed', function (data) {

        // Check the secret key again

        if (data.key === secret) {

            // Tell all connected clients to navigate to the new slide

            presentation.emit('navigate', {
                hash: data.hash
            });
        }
    });
});

console.log('Your presentation is running on http://localhost:' + port);