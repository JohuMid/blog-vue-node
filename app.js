var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session')


var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var topicsRouter = require('./routes/topics');
var userPagesRouter = require('./routes/userpages');
var backstageRouter = require('./routes/backstage');


var app = express();


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use('/public/', express.static(path.join(__dirname, './public/')))

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  // 配置加密字符串，它会在原有加密基础之上和这个字符串拼起来去加密
  // 目的是为了增加安全性，防止客户端恶意伪造
  secret: 'SCF',
  resave: false,
  saveUninitialized: false, // 无论你是否使用 Session ，我都默认直接给你分配一把钥匙
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7, // 设置 session 的有效时间，单位毫秒，一周过期需要重新登录
  },
}));

app.use(indexRouter);
app.use(usersRouter);
app.use(topicsRouter);
app.use(userPagesRouter);
app.use(backstageRouter)

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


var server = app.listen(3000);

var io = require('socket.io')(server);
var _ = require('underscore');

//引入数据库封装模块
var db = require("./public/javascripts/db");

io.on('connection', function (socket) {


  socket.on('online', value => {
    // 查询有无消息状态
    db.query(`SELECT topic.tTopic,topic.tId,user.userName,user.uId,state.type FROM state,user,topic WHERE topic.tId = state.tId and user.uId = state.fromId and state.toId=` + value + ``, [], function (results, rows) {


      if (results === '[]') {
        // 服务器向客户端推送
        socket.emit('connection', null)
      } else {
        socket.emit('connection', results)
      }
    })
    // 删除状态
    db.query(`DELETE FROM state WHERE state.toId=` + value + ``, [], function (results, rows) {})
  })

  // 服务器接收客户端发送数据

  // 收藏
  socket.on('star', value => {
    // 点击收藏
    // console.log(value.fromId);
    // console.log(value.toId);

    // 储存点赞的状态
    db.query(`
                INSERT INTO state (fromId,toId,tId,type,sTime)
                VALUES(` + value.fromId + `,` + value.toId + `,` + value.tId + `,'star',NOW())
                `, [], function (results, rows) {

    })
  })

  // 关注
  socket.on('like', value => {
    // console.log(value.fromId);
    // console.log(value.toId);

    // 储存点赞的状态
    db.query(`
                INSERT INTO state (fromId,toId,type,sTime)
                VALUES(` + value.fromId + `,` + value.toId + `,'like',NOW())
                `, [], function (results, rows) {

    })
  })

  // 评论
  socket.on('chat', value => {
    // 点击收藏
    // console.log(value.fromId);
    // console.log(value.toId);

    // 储存点赞的状态
    db.query(`
                INSERT INTO state (fromId,toId,tId,type,sTime)
                VALUES(` + value.fromId + `,` + value.toId + `,` + value.tId + `,'chat',NOW())
                `, [], function (results, rows) {

    })
  })



  socket.on('disconnect', function () {
    console.log('一个用户下线');
  })

});


module.exports = app;

