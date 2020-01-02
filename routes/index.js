var express = require('express');
var router = express.Router();

var db = require("./../public/javascripts/db");

router.get('/', function (req, res, next) {

  res.send('卧槽连上了')
})

// 查找大小banner信息
router.get('/bannertopic', function (req, res, next) {

  db.query(`SELECT topic.tTopic,topic.tHeadImage,collect.tId,count(*) AS count from topic,user,collect WHERE topic.uId=user.uId and collect.tId=topic.tId GROUP BY tId  ORDER BY count DESC  LIMIT 3`, [], function (results, rows) {

    var list = results

    db.query(`SELECT topic.tTopic,topic.tHeadImage,chat.tId,count(*) AS count from topic,user,chat WHERE topic.uId=user.uId and chat.tId=topic.tId GROUP BY tId  ORDER BY count DESC  LIMIT 3`, [], function (results, rows) {
      res.status(200).json({
        err_code: 0,
        message: 'OK',
        results1: list,
        results2: results
      })
    })
  })
})

// 查找文章简略信息
router.get('/topiclist', function (req, res, next) {

  var page = req.query.page

  console.log(page);

  if (Number(page) === 0) {
    db.query(`select topic.uId,topic.tId,topic.tTopic,topic.tTime,topic.tWords,topic.tHeadImage,user.userAvatar,user.userName from topic,user WHERE topic.uId = user.uId order by tId desc LIMIT 8`, [], function (results, rows) {

      var list = results;

      db.query(`SELECT COUNT(*) from topic;`, [], function (results, rows) {
        res.status(200).json({
          err_code: 0,
          message: 'OK',
          results: list,
          num: results
        })
      })
    })
  } else {
    db.query(`select topic.uId,topic.tId,topic.tTopic,topic.tTime,topic.tWords,topic.tHeadImage,user.userAvatar,user.userName from topic,user WHERE topic.uId = user.uId order by tId desc LIMIT ` + (8 + (page - 1) * 2) + `,2`, [], function (results, rows) {

      res.status(200).json({
        err_code: 0,
        message: 'OK',
        results: results,
      })
    })
  }
})


router.get('/alltopiclist', function (req, res, next) {
  db.query(`select topic.uId,topic.tId,topic.tTopic,topic.tTime,topic.tWords,topic.tHeadImage,user.userAvatar,user.userName from topic,user WHERE topic.uId = user.uId order by tId desc`, [], function (results, rows) {
    res.status(200).json({
      err_code: 0,
      message: 'OK',
      results: results,
    })
  })
})


// 查找文章详细信息
router.post('/topicdetail', function (req, res, next) {
  var body = req.body;
  var topicIndex = body.topicIndex;

  db.query(`SELECT user.uId,topic.tTopic, topic.tContents, topic.tTime,user.userName,user.userAvatar from topic,user WHERE tId=` + topicIndex + ` and topic.uId = user.uId;`, [], function (results, rows) {

    res.status(200).json({
      err_code: 0,
      message: 'OK',
      results: results,
    })
  })
})


// 获取用户信息
router.get('/reqdata', function (req, res, next) {

  if (req.session.user === undefined) {
    // 没有登录
    res.status(200).json({
      err_code: 6,
      message: '"User is not logged in"',
    })
  } else {
    // 已经登录
    res.status(200).json({
      err_code: 0,
      message: 'OK',
      user: req.session.user
    })
  }
});


module.exports = router;
