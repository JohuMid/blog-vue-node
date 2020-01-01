var express = require('express');
var router = express.Router();
// 数据库操作模块
var db = require("./../public/javascripts/db");


// 获取用户数据
router.post('/getusersdata', function (req, res) {

  var body = req.body
  var pageNum = body.pageNum
  var currentPage = body.currentPage

  db.query(`
            SELECT uId,userName,userStatement,userEmail,userRegDate FROM
            user order by uId LIMIT ` + pageNum * (currentPage - 1) + `,` + pageNum + `;`, [], function (results, rows) {


    var list = results;

    db.query(`SELECT COUNT(*) from user;`, [], function (results, rows) {
      res.status(200).json({
        err_code: 0,
        message: 'OK',
        results: list,
        num: results
      })
    })
  })
})

// 获取文章数据
router.post('/gettopicsdata', function (req, res) {

  var body = req.body
  var pageNum = body.pageNum
  var currentPage = body.currentPage
  var uId = body.uId

  if (!uId) {

    db.query(`
            SELECT topic.tId,user.userName,topic.tTopic,topic.tTime FROM
            topic,user WHERE topic.uId=user.uId order by tId LIMIT ` + pageNum * (currentPage - 1) + `,` + pageNum + `;`, [], function (results, rows) {

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


    db.query(`
            SELECT topic.tId,user.userName,topic.tTopic,topic.tTime FROM
            topic,user WHERE topic.uId=user.uId and topic.uId= ` + uId + ` order by tId LIMIT ` + pageNum * (currentPage - 1) + `,` + pageNum + `;`, [], function (results, rows) {

      var list = results;

      db.query(`SELECT COUNT(*) FROM (SELECT topic.tId,user.userName,topic.tTopic,topic.tTime FROM
            topic,user WHERE topic.uId=user.uId and topic.uId= ` + uId + `) AS temp;`, [], function (results, rows) {
        res.status(200).json({
          err_code: 0,
          message: 'OK',
          results: list,
          num: results
        })
      })
    })
  }


})

// 获取评论数据
router.post('/getchatsdata', function (req, res) {

  var body = req.body
  var pageNum = body.pageNum
  var currentPage = body.currentPage
  var tId = body.tId

  if (!tId) {
    db.query(`
            SELECT chat.rId,user.userName,topic.tTopic,chat.rChat,chat.rTime FROM
            topic,user,chat WHERE chat.uId=user.uId and chat.tId=topic.tId order by rId LIMIT ` + pageNum * (currentPage - 1) + `,` + pageNum + `;`, [], function (results, rows) {

      var list = results;

      db.query(`SELECT COUNT(*) from chat;`, [], function (results, rows) {
        res.status(200).json({
          err_code: 0,
          message: 'OK',
          results: list,
          num: results
        })
      })
    })
  } else {
    db.query(`
            SELECT chat.rId,user.userName,topic.tTopic,chat.rChat,chat.rTime FROM
            topic,user,chat WHERE chat.uId=user.uId and chat.tId=topic.tId and chat.tId=` + tId + ` order by rId LIMIT ` + pageNum * (currentPage - 1) + `,` + pageNum + `;`, [], function (results, rows) {

      var list = results;

      db.query(`SELECT COUNT(*) FROM (SELECT chat.rId,user.userName,topic.tTopic,chat.rChat,chat.rTime FROM
            topic,user,chat WHERE chat.uId=user.uId and chat.tId=topic.tId and chat.tId=` + tId + `) AS temp;`, [], function (results, rows) {
        res.status(200).json({
          err_code: 0,
          message: 'OK',
          results: list,
          num: results
        })
      })
    })
  }
})

// 删除评论
router.get('/delchat', function (req, res) {
  var rId = req.query.rId;

  db.query(`DELETE FROM chat WHERE rId = ` + rId + ``, [], function (results, rows) {
    res.status(200).json({
      err_code: 0,
      message: 'OK',
    })
  })
})

// 删除文章
router.get('/deltopic', function (req, res) {
  var tId = req.query.tId;

  db.query(`DELETE FROM topic WHERE tId = ` + tId + ``, [], function (results, rows) {
    res.status(200).json({
      err_code: 0,
      message: 'OK',
    })
  })

})

module.exports = router;
