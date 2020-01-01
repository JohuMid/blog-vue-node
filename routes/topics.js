var express = require('express');
var router = express.Router();
let fs = require('fs');
var uuid = require('uuid')

// 数据库操作模块
var db = require("./../public/javascripts/db");
var Base64 = require('js-base64').Base64

// 发布文章
router.post('/publish', function (req, res) {
  var body = req.body;
  var theme = body.userTheme;
  var topic = body.userTopic

  var uId = body.uId

  // 正则匹配第一个图片地址
  var reg = /<\s*img\s+[^>]*?src\s*=\s*(\'|\")(.*?)\1[^>]*?\/?\s*>/;

  var headImage = (Base64.decode(topic).match(reg)[0]);

  // 获取URL
  var insertHtml;
  var re = /src=\"([^\"]*?)\"/i;
  var arr = headImage.match(re);
  if (arr != undefined && arr.length > 0) {
    insertHtml = arr[1];
  }

  db.query(`
                INSERT INTO topic (uId,tTopic,tHeadImage,tWords,tContents,tTime)
                VALUES('` + uId + `','` + theme + `','` + insertHtml + `','` + getWord(Base64.decode(topic)) + `','` + topic + `',NOW())
                `, [], function (results, rows) {
    // 发布成功
    res.status(200).json({
      err_code: 0,
      message: 'OK',
    })
  })
})

// 保存文章当中的图片
router.post('/uplodtopicimg', function (req, res) {

  var body = req.body;

  // 用户头像信息
  var base64Data = body.data.replace(/^data:image\/\w+;base64,/, "");

  var dataBuffer = new Buffer(base64Data, 'base64');

  var timestamp = uuid.v1();

  var uId = body.uId;

  fs.writeFile(`public/images/topic/` + uId + `_` + timestamp + `.png`, dataBuffer, function (err) {
    if (err) {
      console.log(err);
    } else {
      res.status(200).json({
        err_code: 0,
        message: 'OK',
        results: uId + `_` + timestamp + '.png'
      })
    }
  });
})

// 修改文章
router.post('/updatetopic', function (req, res) {
  var body = req.body;
  var theme = body.userTheme;
  var topic = body.userTopic

  var tId = body.tId

  db.query(`
                  UPDATE topic SET tTopic='` + theme + `', tContents='` + topic + `' WHERE tId=` + tId + `
                `, [], function (results, rows) {

    // 修改成功
    res.status(200).json({
      err_code: 0,
      message: 'OK',
    })
  })
})


// 上一篇
router.get('/prev', function (req, res) {
  var topicIndex = req.query.topicIndex

  db.query(`select tId FROM topic where tId>  ` + topicIndex + `  limit 1`, [], function (results, rows) {

    if (results === '[]') {
      res.status(200).json({
        err_code: 8,
        message: 'No previous',
      })
    } else {
      res.status(200).json({
        err_code: 0,
        message: 'OK',
        results: results
      })
    }
  })

})

// 下一篇
router.get('/next', function (req, res) {

  var topicIndex = req.query.topicIndex

  db.query(`select tId FROM topic where tId<  ` + topicIndex + ` order by  tId desc limit 1`, [], function (results, rows) {

    if (results === '[]') {
      res.status(200).json({
        err_code: 9,
        message: 'No next post',
      })
    } else {
      res.status(200).json({
        err_code: 0,
        message: 'OK',
        results: results
      })
    }
  })
})
router.get('/publishchat', function (req, res) {
  var tId = req.query.topicIndex
  var chat = req.query.chat

  var uId = req.query.uId

  db.query(`
                INSERT INTO chat (tId,uId,rChat,rTime)
                VALUES(` + tId + `,` + uId + `,'` + chat + `',NOW())
                `, [], function (results, rows) {

    res.status(200).json({
      err_code: 0,
      message: 'OK',
    })
  })
})

// 获取评论
router.get('/chat', function (req, res) {

  var tId = req.query.topicIndex

  db.query(`
            SELECT user.uId,user.userAvatar,user.userName,chat.rChat FROM
            chat,user
            where chat.tId=` + tId + ` and chat.uId=user.uId order by  rId desc`, [], function (results, rows) {

    res.status(200).json({
      err_code: 0,
      message: 'OK',
      results: results
    })
  })
})

router.get('/collect', function (req, res) {
  var tId = req.query.topicIndex

  var uId = req.query.uId

  db.query(`
                INSERT INTO collect (tId,uId,cTime)
                VALUES(` + tId + `,` + uId + `,NOW())
                `, [], function (results, rows) {
    res.status(200).json({
      err_code: 0,
      message: 'OK',
    })
  })


})
// 取消收藏
router.get('/cancelcollect', function (req, res) {
  var tId = req.query.topicIndex

  var uId = req.query.uId

  db.query(`
                DELETE FROM collect WHERE tId=` + tId + ` and uId = ` + uId + `;
                `, [], function (results, rows) {
    res.status(200).json({
      err_code: 0,
      message: 'OK',
    })
  })

})
// 是否该用户已经收藏 获取收藏量
router.get('/isuserstar', function (req, res) {
  var tId = req.query.topicIndex

  var uId = req.query.uId

  db.query(`
            SELECT cId FROM
            collect
            where tId=` + tId + ` and uId= ` + uId + ``, [], function (results, rows) {

    var list = results

    db.query(`
            SELECT COUNT(*) FROM
            collect
            where tId=` + tId + ``, [], function (results, rows) {

      // console.log(results);

      res.status(200).json({
        err_code: 0,
        message: 'OK',
        results: list,
        results2: results
      })
    })
  })
})

// 获取文章收藏量
router.get('/topiccollectnum', function (req, res) {
  var tId = req.query.topicIndex

  db.query(`
            SELECT cId FROM
            collect
            where tId=` + tId + ` and uId= ` + uId + ``, [], function (results, rows) {

    console.log(results);

    res.status(200).json({
      err_code: 0,
      message: 'OK',
      results: results
    })
  })
})

function getWord(value) {
  let description = value.replace(/(\n)/g, "");
  description = description.replace(/(\t)/g, "");
  description = description.replace(/(\r)/g, "");
  description = description.replace(/<\/?[^>]*>/g, "");
  description = description.replace(/\s*/g, "");
  return (description.substring(0, 50))
}


module.exports = router;
