// Komen server script
// Author: yohanes.gultom@gmail.com

var express = require("express"),
    expressSanitizer = require('express-sanitizer'),
    bodyParser = require('body-parser'),
    moment = require('moment'),
    Datastore = require('nedb'),
    request = require('request'),
    fs = require('fs'),
    nodemailer = require('nodemailer'),
    later = require('later'),
    log4js = require('log4js')

// read config
var data = fs.readFileSync('server/config.json'),
    env = process.env.NODE_ENV || 'production',
    config = JSON.parse(data),
    PORT = config.server_port,
    RECAPTCHA_URL = config.recaptcha_url,
    RECAPTCHA_SECRET = config.recaptcha_secret,
    DB_PATH = config.db_path,
    MAILER = config.mailer,
    NODEMAILER_STR = 'smtps://' + MAILER.username + ':' + MAILER.password + '@' + MAILER.smtp

// logging
log4js.configure({
  appenders: [
    { type: 'console' },
    { type: 'file', filename: 'server/server.log', category: 'komen' }
  ],
  replaceConsole: true
})
var logger = log4js.getLogger('komen')
logger.setLevel((env == 'production') ? config.log_level : 'INFO')


// load database
var db = (env == 'production') ? new Datastore({filename: DB_PATH, autoload: true }) : new Datastore(),
    app = express()

// set db index
db.ensureIndex({ fieldName: 'post' }, function (err) {
  if (err) logger.error(err)
})

// support json encoded bodies
app.use(bodyParser.json())
// support encoded bodies
app.use(bodyParser.urlencoded({ extended: true }))
// sanitizer
app.use(expressSanitizer())

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
    var url = req.query.post ? req.sanitize(normalizeUrl(req.query.post)) : ''
    db.find({ post: url })
        .sort({ datetime: 1 })
        .exec(function(err, comments) {
            if (err) {
                logger.error(err)
                res.status(500).json(err)
            }
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

// count comments per post
app.get("/api/comments-count", function(req, res) {
    var posts = req.query.posts,
        promises = []

    if (posts && posts.length > 0) {
        if (posts.constructor != Array) {
            posts = [posts]
        }
        posts.forEach(function(p) {
            p = normalizeUrl(req.sanitize(p))
            promises.push(new Promise(function (resolve, reject) {
                db.count({ post: p }, function (err, count) {
                    if (err) {
                        reject(err)
                    } else {
                        resolve([p, count])
                    }
                })
            }))
        })
        Promise.all(promises).then(function (counts) {
            var result = {}
            counts.forEach(function (tuple) {
                result[tuple[0]] = tuple[1]
            })
            res.json(result)
        }, function (errors) {
            res.status(500).json(errors)
        })
    }
});

// post new comment
// by post id (the post url)
app.post("/api/comments", function(req, res) {
    var comment = {
            post: req.body.post ? normalizeUrl(req.sanitize(req.body.post)) : req.body.post,
            name: req.body.name ? req.sanitize(req.body.name) : req.body.name,
            body: req.body.body ? req.sanitize(req.body.body) : req.body.body,
            datetime: new Date(),
            notifdate: null
        },
        recaptchaResponse = req.body.recaptcha,
        ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress,
        formData = {
            secret: RECAPTCHA_SECRET,
            response: recaptchaResponse,
            remoteip: ip
        }

    // validate
    if (!comment.post || !comment.name || !comment.body) {
        res.sendStatus(400).send('Empy values in comment')
    }

    // validate recaptcha
    request.post({url: RECAPTCHA_URL, form: formData}, function(err, httpResponse, body){
        if (err) {
            logger.error(err)
            res.status(500).send(err)
        }
        body = JSON.parse(body)
        if (body.success != true) {
            res.status(500).json(body)
        } else {
            db.insert(comment, function (err, comment) {
                if (err) {
                    logger.error(err)
                    res.status(500).json(err)
                }
                res.sendStatus(204)
            })
        }
    })
});

// run express
var server = app.listen(PORT, function() {
    logger.info('Komen is running on http://localhost:' + PORT)
})

// scheduled comment notification email
var transporter = nodemailer.createTransport(NODEMAILER_STR),
    mailOptions = {
        from: '"' + MAILER.sender_name + '" <' + MAILER.username + '>',
        to: MAILER.username
    }

function notifyAboutNewComments() {
    db.find({ notifdate: null })
        .sort({ datetime: -1 })
        .exec(function(err, comments) {
            if (err) {
                logger.error(err)
                throw err
            }
            if (comments.length > 0) {
                var body = [],
                    subject = 'You have ' + comments.length + ' new comment(s)'
                body.push('<p>You have <strong>' + comments.length + '</strong> new comment(s):</p><ul>')
                comments.forEach(function(c) {
                    body.push('<li><strong>' + c.name + '</strong> ')
                    body.push('at ' + moment(c.datetime).format('LLLL') + ' ')
                    body.push('on <a href="' + c.post  + '">' + c.post + '</a> ')
                    body.push('said: <p>' + c.body + '</p></li>')
                })
                body.push('</ul>')
                mailOptions.subject = subject
                mailOptions.html = body.join('')

                // send email
                transporter.sendMail(mailOptions, function(error, info){
                    if (error) {
                        logger.error(error)
                    }
                    logger.info('Message sent: ' + info.response)

                    // update notification date
                    var now = new Date(),
                        commentIds = comments.map(function(c) {return c._id})
                    db.update(
                        { _id: {$in: commentIds} },
                        { $set: { notifdate: now } },
                        { multi: true },
                        function (err, numReplaced) {
                            if (error) {
                                logger.error(error)
                            }
                            logger.info(commentIds.length + ' comments\' notifdate have been updated')
                        }
                    )
                })
            } else {
                logger.info('No new comments')
            }
        })
}

function normalizeUrl(url) {
    return url.trim().replace(/^https?\:\/\//i, '')
}

// run scheduler
later.date.localTime()
later.setInterval(
    notifyAboutNewComments,
    // check and send notification at 8am, 12pm and 7pm everyday
    later.parse.recur().on(8, 12, 19).hour()
)

// export for testing
module.exports = {
    server: server,
    config: config,
    db: db
}
