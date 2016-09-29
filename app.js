var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var passport = require('./passport.js');
var session = require('express-session');
var MongoStore = require('express-session-mongo');
var hbs = require('hbs');
var glob = require('glob');
var fs = require('fs');

var routes = require('./routes/index');
var admin = require('./routes/admin/index');
var api = require('./routes/api');
var upload = require('./routes/file-upload');
var pdfDownload = require('./routes/pdf-download');
var users = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

glob('./views/**/partials/**/*.hbs', (err, files) =>
    ( files || [] )
        .map(file => {
            const [,before, after] = file.match(/^\.\/views\/(.*)\/?partials\/(.*)\.hbs$/) || [,'',''];

            const template_name = [...(before.split('/').filter(Boolean)), ...(after.split('/'))]
                    .join('__')
                    .toLowerCase()
                    .replace(/[^a-z0-9_]+/, '_');

            return [template_name, file]
        })
        .forEach(([template_name, file]) =>
            fs.readFile(
                file, 'utf8',
                (err, contents) => err
                    ? console.error(err)
                    : hbs.registerPartial(template_name, contents)
            )
        )
);
hbs.registerHelper('join', (arr, separator=', ') => [...(arr || [])].join(separator));
hbs.registerHelper('concat', (...pieces) => pieces.length > 1 ? pieces.slice(0, -1).join('') : '');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.raw({type: 'image/png', limit: '8mb'}));
app.use(cookieParser());

//TODO: load secret from config
app.use(session({
    secret: process.env.SESSION_SECRET || 'frostgrave',
    resave: false, saveUninitialized: false,
    store:  new MongoStore({db: 'frostgrave-session'})
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(require('node-sass-middleware')({
    src:          path.join(__dirname, 'public'),
    dest:         path.join(__dirname, 'public'),
    sourceMap:    true,
    includePaths: [
        path.join(__dirname, 'node_modules', 'foundation-sites', 'scss'),
        path.join(__dirname, 'node_modules', 'font-awesome', 'scss')
    ]
}));

app.use(express.static(path.join(__dirname, 'public')));
app.use('/upload', express.static(path.join(__dirname, 'uploads')));

app.use('/', routes);
app.use('/admin', admin);
app.use('/api', api);
app.use('/pdf', pdfDownload);
app.use('/upload', upload);
app.use('/user', users(passport));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    res.render('error/not-found', {title: 'Not Found - Frostgrave Roster Management', url: req.baseUrl + req.url})
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error/error', {
            message: err.message,
            error:   err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error/error', {
        message: err.message,
        error:   {}
    });
});


module.exports = app;
