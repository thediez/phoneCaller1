exports.opendb = function (settings, callback) {
    var pg = require('pg');
    var client = new pg.Client(conString);
    // var conString = "postgres://postgres:Radius123@10.0.0.4:5432/hh_resume";
    var conString = "postgres://postgres:Radius123@109.188.79.65:5432/hh_resume";

    client.connect();
}