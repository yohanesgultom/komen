// Komen client script
// Author: yohanes.gultom@gmail.com

var KOMEN_SRC = 'src/',
    KOMEN_AVATAR = 'avatar.png',
    KOMEN_SERVER = '/komen/api/',
    RECAPTCHA_KEY = ''

function Komen (_src, _server) {
    var that = this
    that.src = _src ? _src + '/' : KOMEN_SRC
    that.server = _server ? _server + '/' : KOMEN_SERVER
    that.post = document.location.href

    this.init = function () {
        var commentStartHereId = 'comment-start-here'
        $('#' + commentStartHereId).append($('<img>').attr('src', that.src + 'komen.gif'))
        $.getJSON(that.server + 'api/comments', {post: that.post}, function(data) {
            var container = $('#' + commentStartHereId).parent(),
                comments = data.comments
            container.append(that.komenForm())
            comments.forEach(function(c) {
                container.append(that.komenPost(c))
            })
            $('#' + commentStartHereId).remove()
        })
    }

    this.loadPosts = function() {
        var container = $('#komen-form').parent(),
            commentStartHereId = 'comment-start-here',
            loading = $('<div>').attr('id', 'commentStartHereId').append($('<img>').attr('src', that.src + 'komen.gif'))

        // remove comments
        $('.komen-post', container).remove()

        // set loading gif
        container.append(loading)

        $.getJSON(that.server + 'api/comments', {post: that.post}, function(data) {
            var comments = data.comments
            comments.forEach(function(c) {
                container.append(that.komenPost(c))
            })
            loading.remove()
        })
    }

    // build comment submission form
    this.komenForm = function (leaveCommentLabel, submitLabel, rows, successMessage, errorMessage) {
        leaveCommentLabel = leaveCommentLabel ? leaveCommentLabel : 'Leave a comment:'
        submitLabel = submitLabel ? submitLabel : 'Submit'
        successMessage = successMessage ? successMessage : 'Thank you'
        errorMessage = errorMessage ? errorMessage : 'Post failed. Please check your connection'
        rows = rows ? rows : 7

        return $('<div>').attr('id', 'komen-form').attr('class', 'well')
        .append($('<h4>').text(leaveCommentLabel))
        .append($('<form>').attr('role', 'form')
        .append(
            $('<div>').attr('class', 'form-group')
                .append($('<input>').attr('class', 'form-control').attr('placeholder', 'Name or email if you want to be contacted').attr('required', true)))
        .append(
            $('<div>').attr('class', 'form-group')
                .append($('<textarea>').attr('class', 'form-control').attr('rows', rows).attr('placeholder', 'Your comment').attr('required', true)))
        // captcha
        .append(
            $('<div>').attr('class', 'form-group')
                .append($('<div>').attr('class', 'g-recaptcha').attr('data-sitekey', RECAPTCHA_KEY)))
        // button
        .append($('<button>').attr('type', 'submit').attr('class', 'btn btn-primary').text(submitLabel).on('click', function() {
            var form = $(this).parent(),
                name = form.find('input').first().val(),
                message = form.find('textarea').first().val(),
                recaptcha = form.find('[name=g-recaptcha-response]').val()

            // only invoke if inputs not empty
            if (name && name.length > 0
                && message && message.length > 0
                && recaptcha && recaptcha.length > 0) {

                // disabled all
                form.find('input, textarea, button').attr('disabled', 'disabled')

                // submit to server
                $.ajax({
                    method: 'POST',
                    url: that.server + 'api/comments',
                    data: JSON.stringify({post: that.post, name: name, body: message, recaptcha: recaptcha}),
                    contentType: 'application/json',
                    success: function (res) {
                            form.find('input, textarea').val('')
                            form.find('input, textarea, button').prop('disabled', false)
                            alert(successMessage)
                            that.loadPosts()
                    },
                    error: function (err) {
                        form.find('input, textarea, button').prop('disabled', false)
                        grecaptcha.reset()
                        alert(err)
                    }
                })
            }
            return false
        }))
        )
    }

    // build comment post DOM
    this.komenPost = function (comment) {
        var avatar = comment.avatar ? comment.avatar : that.src + KOMEN_AVATAR,
            body = $('<div>').attr('class', 'media-body')
                .append($('<h4>').attr('class', 'media-heading')
                    .append($('<div>').attr('class', 'name').text(comment.name))
                    .append($('<small>').text(comment.datetime)))
                .append($('<p>').text(comment.body))

        if (comment.comments) {
            comment.comments.forEach(function (c) {
                body.append(komenPost(c))
            })
        }

        return $('<div>').attr('class', 'komen-post media').attr('id', 'komen-post-' + comment.id)
        .append($('<a>').attr('class', 'pull-left').attr('href', 'javascript:').append($('<img>').attr('class', 'media-object').attr('src', avatar)))
        .append(body)
    }

    this.init()

}
