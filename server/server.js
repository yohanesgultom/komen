// Komen server script
// Author: yohanes.gultom@gmail.com

// config
var RECAPTCHA_SECRET = '6Lde8wgUAAAAAAIQK12vVBmSlHDl5b2TZ6CMUUVn',
    DB_PATH = 'server/db'
    PORT = 3000,
    RECAPTCHA_URL = 'https://www.google.com/recaptcha/api/siteverify'

var express = require("express"),
    bodyParser = require('body-parser'),
    moment = require('moment'),
    Datastore = require('nedb'),
    request = require('request'),
    db = new Datastore({ filename: DB_PATH, autoload: true }),
    app = express(),
    LOG = {
        success: '\x1b[32m%s\x1b[0m',
        error: '\x1b[31m%s\x1b[0m',
        warn: '\x1b[93m%s %s\x1b[0m'
    }

// support json encoded bodies
app.use(bodyParser.json())
// support encoded bodies
app.use(bodyParser.urlencoded({ extended: true }))

// allow cors
// because server with different port
// is also considered cross-site
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
  next()
});

// get all comments
// by post id (the post url)
app.get("/api/comments", function(req, res) {

    db.find({ post: req.query.post })
        .sort({ datetime: 1 })
        .exec(function(err, comments) {
            if (err) res.status(500).json(err)
            // formatting
            var response = {
                comments: comments.map(function (c) {
                    return {
                        name: c.name,
                        body: c.body,
                        datetime: moment(c.datetime).format('LLLL')
                    }
                })
            }
            res.json(response)
        })
});

// post new comment
// by post id (the post url)
app.post("/api/comments", function(req, res) {
    var comment = {
            post: req.body.post,
            name: req.body.name,
            body: req.body.body,
            datetime: new Date()
        },
        recaptchaResponse = req.body.recaptcha,
        ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress,
        formData = {
            secret: RECAPTCHA_SECRET,
            response: recaptchaResponse,
            remoteip: ip
        }

    // validate recaptcha
    request.post({url: RECAPTCHA_URL, form: formData}, function(err, httpResponse, body){
        if (err) res.status(500).send(err)
        body = JSON.parse(body)
        if (body.success != true) {
            res.status(500).json(body)
        } else {
            db.insert(comment, function (err, comment) {
                if (err) res.status(500).json(err)
                res.sendStatus(204)
            })
        }
    })
});

// run express
app.listen(PORT)
console.log(LOG.success, 'Komen is running on http://localhost:' + PORT)
