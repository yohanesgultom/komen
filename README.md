# Komen

Self-hosted comment service. Powered by express.js and nedb (mongo-like embedded database)

> Todo:
>* Use iframe to maintain isolated style and avoid CSS conflics
>* Handle nested comment (just 1 level like facebook)
>* Use jquery html parsing instead dom builder for verbosity
>* Email notification for new comment
>* Render number of comment (to be displayed on post's excerpt)

## Server side

#### Dependencies

* Node.js https://nodejs.org

#### Setup

Clone repo and run

```
$ npm install
```

Set Google ReCaptcha secret, db location and port in `server/server.js`

```javascript
// config
var RECAPTCHA_SECRET = '',
    DB_PATH = 'server/db'
    PORT = 3000
```

Run the server

```
$ npm start
```

Consider using nodejs `forever` or `pm2` to run it in production

## Client side

#### Dependencies

* Jquery https://jquery.com/
* Google reCaptcha https://www.google.com/recaptcha/api.js
* Bootstrap (optional) https://getbootstrap.com/

#### Setup

Step 0: Download zip/clone repo, copy `src` dir to your web `js` dir and rename it whatever you like eg `komen`

Step 1: Register for Google ReCaptcha https://www.google.com/recaptcha and set the key in `komen.js`

```javascript
var RECAPTCHA_KEY = 'recaptchakey',
```

Step 2: Add dependencies

```html
<html>
<head>
    ...

    <link href="css/bootstrap.min.css" rel="stylesheet">
</head>
<body>
...
    <script src="js/jquery.js"></script>
    <script src="js/renamed-src-dir/komen.js"></script>
    <script type="text/javascript" src="/assets/js/komen/komen.js"></script>
    <script>
      var onReCaptchaLoad = function() {
          var komen = Komen('/assets/js/komen', 'http://localhost:3000');
      }
    </script>
    <script src="https://www.google.com/recaptcha/api.js?render=explicit&onload=onReCaptchaLoad"></script>
</body>
</html>
```

Step 3: Add `div` with id `comment-start-here` to where you want the comment form and comments placed

```html
...
<div id="comment-start-here"></div>
...
```
> Note:
> * Check `demo` dir for example
> * If the ReCaptcha not rendering, clear your server's (eg. DNS cache) & browser's cache (or use private mode)
