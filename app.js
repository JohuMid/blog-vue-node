var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session')
// 获取当前日期
var date = new Date()

date = date.toLocaleDateString();


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

var bodyParser = require('body-parser');
app.use(bodyParser.json({limit: '5mb'}));
app.use(bodyParser.urlencoded({limit: '5mb', extended: true}));

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

// node定时任务，每日零点插入运营数据
var schedule = require('node-schedule');

var scheduleCronstyle = () => {
  //每天零时一分定时执行一次:
  schedule.scheduleJob('0 1 0 * * *', () => {
    db.query(`select * from operation WHERE oDate = '` + date + `'`, [], function (results, rows) {

      if (results === '[]') {
        db.query(`
                INSERT INTO operation (oVisit,oRead,oLogin,oRegister,oDate,oTime)
                VALUES(0,0,0,0,'` + date + `',NOW())
                `, [], function (results, rows) {
        })
      } else {
        db.query(`
                UPDATE operation set oVisit=oVisit+1
                `, [], function (results, rows) {
        })
      }
    })
  });
}

scheduleCronstyle();

// socket消息提示
var io = require('socket.io')(server);
var _ = require('underscore');

//引入数据库封装模块
var db = require("./public/javascripts/db");

io.on('connection', function (socket) {

  console.log('一个用户上线');


  socket.on('online', value => {
    // value是用户Id
    // console.log(value);

    // 查询有无消息状态
    db.query(`SELECT topic.tTopic,topic.tId,user.userName,user.uId,tempstate.type FROM tempstate,user,topic WHERE topic.tId = tempstate.tId and user.uId = tempstate.fromId and tempstate.toId=` + value + ``, [], function (results, rows) {

      console.log(results);

      if (results === '[]') {
        // 服务器向客户端推送
        socket.emit('connection', null)
      } else {
        socket.emit('connection', results)
        // 删除状态
        db.query(`DELETE FROM tempstate WHERE tempstate.toId=` + value + ``, [], function (results, rows) {
        })
      }
    })
  })

  // 服务器接收客户端发送数据

  // 收藏
  socket.on('star', value => {
    // 点击收藏
    // console.log(value.fromId);
    // console.log(value.toId);

    // 储存收藏的状态
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

    // 储存关注的状态
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

    // 储存评论的状态
    db.query(`
                INSERT INTO state (fromId,toId,tId,type,sTime)
                VALUES(` + value.fromId + `,` + value.toId + `,` + value.tId + `,'chat',NOW())
                `, [], function (results, rows) {

    })
  });
  // 评论
  socket.on('reply', value => {
    // 点击收藏
    // console.log(value.fromId);
    // console.log(value.toId);

    // 储存评论的状态
    db.query(`
                INSERT INTO state (fromId,toId,tId,type,sTime)
                VALUES(` + value.fromId + `,` + value.toId + `,` + value.tId + `,'reply',NOW())
                `, [], function (results, rows) {

    })
  });
  // 通过审核
  socket.on('pass', value => {
    // 点击收藏
    // console.log(value.fromId);
    // console.log(value.toId);

    // 储存评论的状态
    db.query(`
                INSERT INTO state (fromId,toId,tId,type,sTime)
                VALUES(` + value.fromId + `,` + value.toId + `,` + value.tId + `,'pass',NOW())
                `, [], function (results, rows) {

    })
  });

  // 通过审核
  socket.on('nopass', value => {
    // 点击收藏
    // console.log(value.fromId);
    // console.log(value.toId);

    // 储存评论的状态
    db.query(`
                INSERT INTO state (fromId,toId,tId,type,sTime)
                VALUES(` + value.fromId + `,` + value.toId + `,` + value.tId + `,'nopass',NOW())
                `, [], function (results, rows) {

    })
  });


  socket.on('disconnect', function () {
    console.log('一个用户下线');
  })

});


module.exports = app;

