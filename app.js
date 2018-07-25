"use strict"
var express = require('express'),
    app = express();
var bodyParser = require('body-parser');
var port = process.env.PORT || 5000;
var io = require('socket.io').listen(app.listen(port));
app.use(express.static(__dirname + '/public'));
var socketList = [];
var id;
const {Pool} = require('pg');
const connectionString = 'postgres://postgres:Radius123@109.188.79.65:5432/hh_resume';
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

//Instantiate new pool of connections
const pool = new Pool({
    connectionString: connectionString,
});

//This method is for home directory
app.get('/', function (req, res) {

});

// This method is for filtering and get list of candidates
//example http://localhost:5000/profile?offset=10&limit=10&from_date=2017-07-10T19:00:00.000Z&to_date=2018-07-16T19:00:00.000Z&key_level=Java&w_sign=0
//example http://localhost:5000/profile - gets list of all candidates
app.get('/profile', function (req, res) {
    var first = true;
    var limit = false;
    var offset = false;
    var limitCount = 0;
    var offsetCount = 0;
    var query = "SELECT * FROM public.resume";
    if (Object.keys(req.query).length != 0) {
        query += " WHERE ";
        if (req.query.hasOwnProperty("from_date") && req.query.hasOwnProperty("to_date")) {
            query += "date_load BETWEEN " + "'" + req.query['from_date'] + "'" + " AND " + "'" + req.query['to_date'] + "'";
            delete req.query['from_date'];
            delete req.query['to_date'];
            first = false;
        }
        if (req.query.hasOwnProperty("last_update_from_date") && req.query.hasOwnProperty("last_update_to_date")) {
            query += "last_update_date BETWEEN " + "'" + req.query['last_update_from_date'] + "'" + " AND " + "'" + req.query['last_update_to_date'] + "'";
            delete req.query['last_update_from_date'];
            delete req.query['last_update_to_date'];
            first = false;
        }
        if (req.query.hasOwnProperty("offset")) {
            offset = true;
            offsetCount = req.query['offset'];
            delete req.query['offset'];
        }
        if (req.query.hasOwnProperty("limit")) {
            limit = true;
            limitCount = req.query['limit'];
            delete req.query['limit'];
        }
        for (var key in req.query) {
            if (key == 'key_level' || key == 'name' || key == 'gender' || key == 'm_comment' || key == 'lavel_year' || key == 'age' || key == 'salary') {
                if (first) {
                    query += key + " LIKE '%" + req.query[key] + "%'";
                    first = false;
                } else {
                    query += " AND " + key + " LIKE '%" + req.query[key] + "%'";
                }
            } else {
                if (first) {
                    query += key + "=" + req.query[key] + " ";
                    first = false;
                } else {
                    query += " AND " + key + "=" + req.query[key] + " ";
                }
            }
        }
        if (limit) {
            query += "limit " + limitCount + " ";
        }
        if (offset) {
            query += "offset " + offsetCount + " ";
        }
    }
    pool.query(query, (err, result) => {
        if (typeof result.rows != "undefined") {
            res.send(result.rows);
        } else {
            res.send("NOTHING FOUND");
        }
    })
});

// This method is for getting html page by id
//example http://localhost:5000/profileHTML/5168
app.get('/profileHTML/:id', function (req, res) {
    const id = req.params.id;
    pool.query('SELECT resume_page FROM public.resume WHERE id=' + id, (err, result) => {
        res.send(result.rows[0]);
    });
});

// This method is for write comments by id
//example http://localhost:5000/comments/5168  put data into body text field
app.put('/comments/:id', (req, res) => {
    const id = req.params.id;
    const data = req.body.text;
    var querys = "UPDATE public.resume SET m_comment='" + data + "' WHERE id=" + id;
    pool.query(querys, (err, result) => {
        res.send("GOT IT");
    });
});

// This method is for calling candidate
//example http://localhost:5000/call/5168
app.put('/call/:id', (req, res) => {
    const id = req.params.id;
    pool.query('SELECT telephone FROM public.resume WHERE id=' + id, (err, result) => {
        io.on('connection', function (socket) {
            socket.to(socketList[0]).emit('callServer', {
                "phoneNumber": res.rows[0].telephone,
            })
        });
        res.send("GOT IT");
    });
});

// Initialize a new socket.io application
// I use sockets for android application for me is most efficient way
// Please check showCalling when event comes from android application , server emits to web part data about calling telephone
var presentation = io.on('connection', function (socket) {
    console.log("client connected: " + socket.id);

    // little hack, bad idea need to rework
    socket.emit('checkIfAndroid', true);

    // little hack, bad idea need to rework
    socket.on('checkIfAndroid', function (flag) {
        if (flag == true) {
            socketList.push(socket.id);
        }
    });

    //This method listen and emits data from db to android application
    socket.on('getNextPhone', function (count) {
        pool.query('SELECT * FROM public.resume WHERE w_sign = 0', (err, result) => {
            socket.emit('getPhone', {
                "phoneNumber": result.rows[count].telephone,
                "name": result.rows[count].name,
                "age": result.rows[count].age,
                "location": result.rows[count].addrLocation,
                "salary": result.rows[count].salary,
                "skills": result.rows[count].key_level,
                "lenght": result.rows.length
            });
        });
    });

    //This method is for showing information about incoming number if number exist in db and emit to web if number found
    socket.on('showCalling', function (incomingNumber) {
        pool.query('SELECT * FROM public.resume WHERE telephone = ' + incomingNumber, (err, result) => {
            if (typeof result.rows != "undefined") {
                socket.to(socketList[0]).emit('showCvByIncomingNumber', {
                    "phoneNumber": result.rows[0].telephone,
                })
            } else {
                console.log("NOTHING FOUND");
            };
        });
    });

    // put audio in to bd need to rework
    socket.on('audio', function (im) {
        pool.query('SELECT * FROM public.resume WHERE w_sign = 0', (err, result) => {

        });
    });

    // socket.on('callCandidate', function (candidateId) {
    //     // var conString = "postgres://postgres:Radius123@10.0.0.4:5432/hh_resume";
    //     var conString = "postgres://postgres:Radius123@109.188.79.65:5432/hh_resume";
    //     var pg = require('pg');
    //     var client = new pg.Client(conString);
    //     client.connect();
    //     const query = client.query('SELECT * FROM public.resume WHERE id = ' + candidateId, (err, res) => {
    //         socket.to(socketList[0]).emit('callServer', {
    //             "phoneNumber": res.rows[0].telephone,
    //         })
    //     })
    // })

    // Clients send the 'slide-changed' message whenever they navigate to a new slide.
    // socket.on('message', function (buttonId) {
    //     if (buttonId.indexOf("info") >= 0) {
    //         id = buttonId.substring(5);
    //         var conString = "postgres://postgres:Radius123@109.188.79.65:5432/hh_resume";
    //         // var conString = "postgres://postgres:Radius123@10.0.0.4:5432/hh_resume";
    //         var pg = require('pg');
    //         var client = new pg.Client(conString);
    //         client.connect();
    //         const query = client.query('SELECT * FROM public.resume WHERE id = ' + id, (err, result) => {
    //             app.get('/profile.ejs', function (req, res) {
    //                 res.render('profile.ejs', {candidates: result.rows});
    //             })
    //         });
    //     } else if (buttonId.indexOf("call") >= 0) {
    //         id = buttonId.substring(5);
    //         console.log(id);
    //     } else if (buttonId.indexOf("comment") >= 0) {
    //         id = buttonId.substring(8);
    //         console.log(id);
    //     }
    // });
});

console.log('Your presentation is running on http://localhost:' + port);