const chai = require('chai'),
    should = chai.should(),
    chaiHttp = require('chai-http'),
    nock = require('nock'),
    moment = require('moment'),
    app = require('../server/server'),
    server = app.server,
    config = app.config,
    db = app.db

chai.use(chaiHttp)

beforeEach('clear database', function() {
  return db.remove({}, { multi: true })
})

describe('POST /api/comments', () => {

    it('should be able to post comment', (done) => {

        // clear everything
        db.remove({}, { multi: true }, (err, removed) => {

            // google recaptcha stub
            var recaptcha = nock(config.recaptcha_url).post('').reply(200, {success: true}),
                postTitle = 'test-post',
                comment = {
                    post: 'http://' + postTitle,
                    name: 'test-name',
                    body: 'test-body'
                }

            // add new comment
            chai.request(server)
                .post('/api/comments')
                .send(comment)
                .end((err, res) => {
                    should.not.exist(err)
                    res.status.should.equal(204)
                    db.find({ post: postTitle }, (err, docs) => {
                        should.not.exist(err)
                        docs.length.should.equal(1)
                        docs[0].post.should.equal(postTitle)
                        docs[0].name.should.equal(comment.name)
                        docs[0].body.should.equal(comment.body)
                        done()
                    })
                })

        })

    })
})

describe('GET /api/comments', () => {

    it('should be able get comment', (done) => {

        var comment = {
            post: 'test-get-comment',
            name: 'test-get-name',
            body: 'test-get-body',
            datetime: new Date(),
            notifdate: null
        }

        // insert dummy data
        db.insert(comment, (err, obj) => {

            // get new comment
            chai.request(server)
                .get('/api/comments')
                .query({post: comment.post})
                .end((err, res) => {
                    should.not.exist(err)
                    res.status.should.equal(200)
                    res.body.comments.length.should.equal(1)
                    res.body.comments[0].should.deep.equal({
                        name: comment.name,
                        body: comment.body,
                        datetime: moment(comment.datetime).format('LLLL')
                    })
                    done()
                })
        })

    })
})

describe('GET /api/comments-count', () => {

    it('should be able get number of comments correctly', (done) => {

        var post = 'test-count-post',
            num = 7,
            comments = []

        for (var i = 0; i < num; i++) {
            comments.push({
                post: post,
                name: 'test-count-name-' + i,
                body: 'test-count-body-' + i,
                datetime: new Date(),
                notifdate: null
            })
        }

        // insert dummy data
        db.insert(comments, (err, list) => {
            chai.request(server)
                .get('/api/comments-count')
                .query({posts: [post]})
                .end((err, res) => {
                    should.not.exist(err)
                    res.status.should.equal(200)
                    var expected = {}
                    expected[post] = num
                    res.body.should.deep.equal(expected)
                    done()
                })
        })

    })
})
