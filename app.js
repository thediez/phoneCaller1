"use strict"
var express = require('express'),
    app = express();
var bodyParser = require('body-parser');
var port = process.env.PORT || 5000;
var io = require('socket.io').listen(app.listen(port));
app.use(express.static(__dirname + '/public'));
var socketList = [];
var id;
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.get('/', function (req, res) {

});

const {Pool} = require('pg');
const connectionString = 'postgres://postgres:Radius123@109.188.79.65:5432/hh_resume';

const pool = new Pool({
    connectionString: connectionString,
});

app.post('/setComment', function (req, res) {

});

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
        if(typeof result.rows != "undefined"){
            res.send(result.rows);
        } else {
            res.send("NOTHING FOUND");
        }
    })
});

// Initialize a new socket.io application
var presentation = io.on('connection', function (socket) {
    console.log("client connected: " + socket.id);
    socket.emit('checkIfAndroid', true);
    socket.on('checkIfAndroid', function (flag) {
        if (flag == true) {
            socketList.push(socket.id);
        }
    });
    socket.on('getNextPhone', function (count) {
        pool.query('SELECT * FROM public.resume WHERE w_sign = 0', (err, result) => {
            socket.emit('getPhone', {
                "phoneNumber": res.rows[count].telephone,
                "name": res.rows[count].name,
                "age": res.rows[count].age,
                "location": res.rows[count].addrLocation,
                "salary": res.rows[count].salary,
                "skills": res.rows[count].key_level,
                "lenght": res.rows.length
            });
            pool.end();
        });
    });

    // put audio in to bd
    socket.on('audio', function (im) {
        pool.query('SELECT * FROM public.resume WHERE w_sign = 0', (err, result) => {
            pool.end();
        });
    });

    //
    socket.on('showCalling', function (incomingNumber) {
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
});

console.log('Your presentation is running on http://localhost:' + port);