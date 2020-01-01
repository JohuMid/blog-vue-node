var express = require('express');
var router = express.Router();
let fs = require('fs');

var uuid = require('uuid')

// 数据库操作模块
var db = require("./../public/javascripts/db");

// 获取用户信息
router.get('/requser', function (req, res, next) {

  var uId = req.query.uId;

  console.log(uId);

  db.query(`SELECT * from user WHERE uId='` + uId + `';`, [], function (results, rows) {

    res.status(200).json({
      err_code: 0,
      message: 'OK',
      results: results,
    })
  })

});
// 编辑用户信息
router.post('/edituser', function (req, res, next) {

  var body = req.body;

  var uId = body.uId;
  var username = body.nickname
  var birthday = body.birthday

  console.log(birthday);

  var local = body.local
  var sex = body.sex
  var intro = body.intro

  db.query(`UPDATE user SET userName='` + username + `' , userLocal='` + local + `' , userBirthday='` + birthday + `' , userSex='` + sex + `' , userStatement='` + intro + `' WHERE uId='` + uId + `'`, [], function (results, rows) {
    // 插入成功
    res.status(200).json({
      err_code: 0,
      message: 'OK',
    })
  })
})

// 头像上传接收
router.post('/editavatar', function (req, res, next) {
  var body = req.body;
  // 用户头像信息
  var base64Data = body.data.replace(/^data:image\/\w+;base64,/, "");

  var dataBuffer = new Buffer(base64Data, 'base64');

  var timestamp = uuid.v1();

  var uId = body.uId;


  fs.writeFile(`public/images/avatar/` + timestamp + `.png`, dataBuffer, function (err) {
    if (err) {
      console.log(err);
    } else {
      // 头像存入服务器
      // req.session.user.userAvatar = timestamp + '.png';
      // console.log("头像保存成功！");
      db.query(`
                UPDATE user SET userAvatar='` + timestamp + `.png' WHERE uId='` + uId + `';
            `, [], function (results, rows) {
        res.status(200).json({
          err_code: 0,
          message: 'OK',
          results: timestamp + '.png'
        })


        /*db.query(`SELECT * FROM users where email = '` + user.email + `'`, [], function (results, rows) {
          req.session.user = results;

          res.send(results);
        })*/
      })
    }
  });
})
// 获取用户发表的文章
router.get('/usertopic', function (req, res, next) {

  var uId = req.query.uId;
  var pageNum = req.query.pageNum
  var currentPage = req.query.currentPage


  db.query(`select tId,topic.tTopic,topic.tTime,user.userAvatar,user.userName from topic,user WHERE topic.uId = user.uId and topic.uId='` + uId + `' order by tId desc LIMIT ` + pageNum * (currentPage - 1) + `,` + pageNum + `;`, [], function (results, rows) {


    var list = results;

    db.query(`SELECT COUNT(*) FROM (select tId,topic.tTopic,topic.tTime,user.userAvatar,user.userName from topic,user WHERE topic.uId = user.uId and topic.uId='` + uId + `') AS temp;`, [], function (results, rows) {
      res.status(200).json({
        err_code: 0,
        message: 'OK',
        results: list,
        num: results
      })
    })
  })
})

// 获取用户收藏的文章
router.get('/usercollect', function (req, res, next) {
  var uId = req.query.uId;
  var pageNum = req.query.pageNum
  var currentPage = req.query.currentPage


  db.query(`select user.uId,topic.tId,topic.tTopic,topic.tTime,user.userAvatar,user.userName from topic,user,collect WHERE topic.uId = user.uId and collect.tId = topic.tId and collect.uId='` + uId + `' order by cId desc LIMIT ` + pageNum * (currentPage - 1) + `,` + pageNum + `;`, [], function (results, rows) {

    var list = results;

    db.query(`SELECT COUNT(*) FROM (select user.uId,topic.tId,topic.tTopic,topic.tTime,user.userAvatar,user.userName from topic,user,collect WHERE topic.uId = user.uId and collect.tId = topic.tId and collect.uId='` + uId + `') AS temp;`, [], function (results, rows) {
      res.status(200).json({
        err_code: 0,
        message: 'OK',
        results: list,
        num: results
      })
    })
  })
})

// 待修改
// 获取用户关注的用户
router.get('/userattention', function (req, res, next) {
  var uId = req.query.uId;
  var pageNum = req.query.pageNum
  var currentPage = req.query.currentPage


  db.query(`select aId,user.uId,user.userAvatar,user.userName,user.userStatement from attention,user WHERE user.uId = attention.usersId and attention.uId =` + uId + ` order by aId desc LIMIT ` + pageNum * (currentPage - 1) + `,` + pageNum + `;`, [], function (results, rows) {

    var list = results;

    db.query(`SELECT COUNT(*) FROM (select aId,user.uId,user.userAvatar,user.userName,user.userStatement from attention,user WHERE user.uId = attention.usersId and attention.uId =` + uId + `) AS temp;`, [], function (results, rows) {
      res.status(200).json({
        err_code: 0,
        message: 'OK',
        results: list,
        num: results
      })
    })
  })
})

// 获取当前用户粉丝信息
router.get('/userfans', function (req, res, next) {
  var uId = req.query.uId;
  var pageNum = req.query.pageNum
  var currentPage = req.query.currentPage


  db.query(`select aId,user.uId,user.userAvatar,user.userName,user.userStatement from attention,user WHERE user.uId = attention.uId and attention.usersId =` + uId + ` order by aId desc LIMIT ` + pageNum * (currentPage - 1) + `,` + pageNum + `;`, [], function (results, rows) {

    var list = results;

    db.query(`SELECT COUNT(*) FROM (select aId,user.uId,user.userAvatar,user.userName,user.userStatement from attention,user WHERE user.uId = attention.uId and attention.usersId =` + uId + `) AS temp;`, [], function (results, rows) {
      res.status(200).json({
        err_code: 0,
        message: 'OK',
        results: list,
        num: results
      })
    })
  })
})


// 关注
router.get('/attention', function (req, res) {
  var usersId = req.query.usersId

  var uId = req.query.uId

  db.query(`
                INSERT INTO attention (uId,usersId,aTime)
                VALUES(` + uId + `,` + usersId + `,NOW())
                `, [], function (results, rows) {
    res.status(200).json({
      err_code: 0,
      message: 'OK',
    })
  })

})
// 取消关注
router.get('/cancelattention', function (req, res) {
  var usersId = req.query.usersId

  var uId = req.query.uId

  db.query(`
                DELETE FROM attention WHERE usersId=` + usersId + ` and uId = ` + uId + `;
                `, [], function (results, rows) {
    res.status(200).json({
      err_code: 0,
      message: 'OK',
    })
  })

})
// 当前用户是否关注
router.get('/isuserattention', function (req, res) {
  var usersId = req.query.usersId

  var uId = req.query.uId

  db.query(`
            SELECT aId FROM
            attention
            where uId=` + uId + ` and usersId= ` + usersId + ``, [], function (results, rows) {

    res.status(200).json({
      err_code: 0,
      message: 'OK',
      results: results,
    })
  })
})

module.exports = router;