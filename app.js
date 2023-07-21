var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');


//Routes
const Constants = require('./constants');
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var statusCheckRouter = require('./routes/statusCheck');
var compareLogsRouter = require('./routes/compareLogs');


var app = express();

const cors = require('cors');

// CORP Policy autorisation
app.use(cors());

// The file in this repertory can be retrieved directly via an URL.
app.use('/screenshots', express.static(path.join(__dirname, 'screenshots')));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/api', statusCheckRouter);
app.use('/logs', compareLogsRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {   
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

//Port d'écoute de votre serveur
const port = 3001;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

module.exports = app;
