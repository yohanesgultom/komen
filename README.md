# Komen

Self-hosted comment service. Powered by [express.js](http://expressjs.com) and [nedb](https://github.com/louischatriot/nedb) (mongo-like embedded database)

> Todo:
>* Use iframe to maintain isolated style and avoid CSS conflics
>* Handle nested comment (just 1 level like facebook)
>* Use jquery html parsing instead dom builder for verbosity

## Server side

#### Dependencies

* Node.js https://nodejs.org

#### Setup

Clone repo and run

```
$ npm install
```
Rename `server/config.json.example` to `config.json` and adjust the values properly. Then you can run the server

```
$ npm start
```

> Consider using package such as `forever` or `pm2` to run it in production

## Client side

#### Dependencies

* Jquery https://jquery.com/
* Google reCaptcha https://www.google.com/recaptcha/api.js
* Bootstrap (optional) https://getbootstrap.com/

> Since the comment form and posts are appended directly to your page, it will follow your CSS. If you are using Bootstrap then you are safe. Otherwise you may want to add specific CSS for them

#### Setup

**Step 0**: Download zip/clone repo, copy `src` dir to your web `js` dir and rename it whatever you like eg `komen`

**Step 1**: Register for Google ReCaptcha https://www.google.com/recaptcha and set the key in `komen.js`

```javascript
var RECAPTCHA_KEY = 'recaptchakey',
```

**Step 2**: Add dependencies

```html
<html>
<head>
    ...

    <link href="css/bootstrap.min.css" rel="stylesheet">
</head>
<body>
...
    <script src="js/jquery.js"></script>
    <script type="text/javascript" src="/assets/js/komen/komen.js"></script>
    <script>
      var onReCaptchaLoad = function() {
          var komen = new Komen('/assets/js/komen', 'http://localhost:3000')
          komen.init()
      }
    </script>
    <script src="https://www.google.com/recaptcha/api.js?render=explicit&onload=onReCaptchaLoad"></script>
</body>
</html>
```

**Step 3**: Add `div` with id `komen-start` to where you want the comment form and comments placed

```html
...
<div id="komen-start"></div>
...
```

**Step 4** (optional): To display comments count (eg. at home or index page), use `span` with id `komen-count` and `data-post` attribute containing the post. Make sure the `data-post` value exactly match the corresponding post's URL

```html
<p><span class="glyphicon glyphicon-time"></span> Posted on August 24, 2013 at 9:00 PM (<span class="komen-count" data-post="http://localhost/komen/demo/">0</span> comment(s))</p>
```

and call `komen.count()` without calling `keren.init()` (except there is a comment form in the same page)

```html
<script src="js/jquery.js"></script>
<script type="text/javascript" src="/assets/js/komen/komen.js"></script>
<script>
    $(document).ready(function() {
        var komen = new Komen('/assets/js/komen', 'http://localhost:3000')
        komen.setCount()        
    })
</script>
```

> Note:
> * Check `demo` dir for example
> * If the ReCaptcha not rendering, clear your server's (eg. DNS cache) & browser's cache (or use private mode)
