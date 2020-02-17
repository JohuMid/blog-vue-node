var express = require('express');
var router = express.Router();
let fs = require('fs');
var uuid = require('uuid')

var base64 = require('js-base64')

// 数据库操作模块
var db = require("./../public/javascripts/db");

// 获取专题
router.get('/special', function (req, res) {
  db.query(`
                SELECT spLabel,spValue,spFloor,spFather FROM special WHERE spSecret=0
                `, [], function (results, rows) {

    var one = JSON.parse(results)
    var one1 = [];
    var one2 = [];
    for (var i = 0; i < one.length; i++) {
      if (Number(one[i].spFloor) === 1) {
        one1.push(
          {
            value: one[i].spValue,
            label: one[i].spLabel
          }
        )
      } else if (Number(one[i].spFloor) === 2) {
        one2.push(one[i])
      }
    }
    var first = JSON.parse(JSON.stringify(one1))

    for (var i = 0; i < one1.length; i++) {
      var count = 0
      var children = []
      for (var j = 0; j < one2.length; j++) {
        if (one2[j].spFather == one1[i].value) {
          children.push(
            {
              value: one2[j].spValue,
              label: one2[j].spLabel
            }
          )
          count++
        }
      }
      if (Number(count) !== 0) {
        first[i]['children'] = children
      }
    }

    one = one.map(o => {
      return {
        'label': o.spLabel,
        'value': o.spValue
      }
    })


    res.status(200).json({
      err_code: 0,
      message: 'OK',
      special: JSON.stringify(first),
      refer: JSON.stringify(one)
    })


  })
})

// 发布文章
router.post('/publish', function (req, res) {
  var body = req.body;
  var theme = body.userTheme;
  var topic = body.userTopic
  var model = body.tModel

  var uId = body.uId

  // 正则匹配第一个图片地址
  var reg = /<\s*img\s+[^>]*?src\s*=\s*(\'|\")(.*?)\1[^>]*?\/?\s*>/;

  var headImage

  if (!(topic).match(reg)) {
    headImage = null;
  } else {
    headImage = ((topic).match(reg)[0]);

    // 获取URL
    var insertHtml;
    var re = /src=\"([^\"]*?)\"/i;
    var arr = headImage.match(re);
    if (arr != undefined && arr.length > 0) {
      insertHtml = arr[1];
    }
  }
  db.query(`
                INSERT INTO topic (uId,tTopic,tHeadImage,tWords,tContents,tCollectNum,tChatNum,tRecommend,tSticky,tCheck,tModel,tTime)
                VALUES('` + uId + `','` + theme + `','` + insertHtml + `','` + getWord(topic) + `','` + topic + `',0,0,0,0,0,'` + model + `',NOW())
                `, [], function (results, rows) {

    db.query(`
                UPDATE user SET userTopicNum=userTopicNum+1 WHERE uId=` + uId + `
            `, [], function (results, rows) {

      // 分词提取文章标签
      /*var content = getAllWord((topic))

      var result = nodejieba.extract(content, 4);

      console.log(result);*/

      // 发布成功
      res.status(200).json({
        err_code: 0,
        message: 'OK',
      })
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
  var topic = body.userTopic;
  var model = body.tModel


  var tId = body.tId

  var reg = /<\s*img\s+[^>]*?src\s*=\s*(\'|\")(.*?)\1[^>]*?\/?\s*>/;

  var headImage

  if (!(topic).match(reg)) {
    headImage = null;
  } else {
    headImage = ((topic).match(reg)[0]);
    // 获取URL
    var insertHtml;
    var re = /src=\"([^\"]*?)\"/i;
    var arr = headImage.match(re);
    if (arr != undefined && arr.length > 0) {
      insertHtml = arr[1];
    }
  }
  db.query(`
                  UPDATE topic SET tModel='` + model + `', tCheck=0,tWords='` + getWord(topic) + `', tHeadImage='` + insertHtml + `',tTopic='` + theme + `', tContents='` + topic + `' WHERE tId=` + tId + `
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

  db.query(`select tId FROM topic where tCheck=1 and tId>  ` + topicIndex + `  limit 1`, [], function (results, rows) {

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

  db.query(`select tId FROM topic where tCheck=1 and tId<  ` + topicIndex + ` order by  tId desc limit 1`, [], function (results, rows) {

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
// 发表评论
router.get('/publishchat', function (req, res) {
  var tId = req.query.topicIndex
  var chat = req.query.chat

  var uId = req.query.uId

  db.query(`
                INSERT INTO chat (tId,uId,rChat,rTime)
                VALUES(` + tId + `,` + uId + `,'` + chat + `',NOW())
                `, [], function (results, rows) {

    db.query(`
                SELECT LAST_INSERT_ID(rId) AS value FROM chat
                `, [], function (results, rows) {

      var rId = (JSON.parse(results)[JSON.parse(results).length - 1].value);

      db.query(`
                UPDATE topic SET tChatNum=tChatNum+1 WHERE tId=` + tId + `
            `, [], function (results, rows) {

        // 发布成功
        res.status(200).json({
          err_code: 0,
          message: 'OK',
          rId: rId
        })
      })
    })
  })
})

router.get('/publishreplychat', function (req, res) {
  var rId = req.query.rId
  var reply = req.query.reply
  var uId = req.query.uId
  var userName = req.query.userName
  var tId = req.query.tId

  db.query(`
                INSERT INTO replyChat (rId,uId,tId,userName,rcReply,rcTime)
                VALUES(` + rId + `,` + uId + `,` + tId + `,'` + userName + `','` + reply + `',NOW())
                `, [], function (results, rows) {
    // 发布成功
    res.status(200).json({
      err_code: 0,
      message: 'OK',
    })

  })
})

// 获取评论和评论回复
router.get('/chat', function (req, res) {

  var tId = req.query.topicIndex

  db.query(`
            SELECT chat.rId,user.uId,user.userAvatar,user.userName,chat.rChat FROM
            chat,user
            where chat.tId=` + tId + ` and chat.uId=user.uId order by  rId desc`, [], function (results, rows) {

    var chatList = JSON.parse(results)
    db.query(`
            SELECT replyChat.rcId,replyChat.rId,replyChat.uId,replyChat.userName,rcReply FROM
            replyChat WHERE replyChat.tId=` + tId + ` ORDER BY replyChat.rcId DESC`, [], function (results, rows) {
      var replyList = (JSON.parse(results));

      for (var i = 0; i < chatList.length; i++) {
        var replayArr = []
        for (var j = 0; j < replyList.length; j++) {
          if (chatList[i].rId === replyList[j].rId) {
            replayArr.push(replyList[j])
          }
        }
        chatList[i]['reply'] = replayArr
      }
      res.status(200).json({
        err_code: 0,
        message: 'OK',
        results: JSON.stringify(chatList)
      })
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
    db.query(`
                UPDATE user SET userCollectNum=userCollectNum+1 WHERE uId=(SELECT uId FROM topic WHERE tId=` + tId + `)
                `, [], function (results, rows) {
      db.query(`
                UPDATE topic SET tCollectNum=tCollectNum+1 WHERE tId=` + tId + ``, [], function (results, rows) {
        res.status(200).json({
          err_code: 0,
          message: 'OK',
        })
      })

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
