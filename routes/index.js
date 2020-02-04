var express = require('express');
var router = express.Router();

var db = require("./../public/javascripts/db");
// 载入模块
// var Segment = require('segment');

// 分词模块
var nodejieba = require("nodejieba");


router.get('/', function (req, res, next) {

  // 创建实例
  // var segment = new Segment();
  // 使用默认的识别模块及字典，载入字典文件需要1秒，仅初始化时执行一次即可
  // segment.useDefault();
  // segment.loadStopwordDict('stopword.txt');
  // segment.loadSynonymDict('synonym.txt');
  //
  // var text = '如今各大平台，如：闲鱼、字节跳动、腾讯、美团等在跨平台开发上均有不低的投入，甚至微信都在小程序引擎投入尝试，这说明 flutter 在这个博弈上目前是取得认可的，而 2019 年接入 flutter的平台越来越多，相信大厂们在这一问题上是经过考虑的。'
  //
  // var result = segment.doSegment(text, {
  //
  //   stripPunctuation: true,
  //   convertSynonym: true,
  //   stripStopword: true
  // });
  const content = '如今各大平台，如：闲鱼、字节跳动、腾讯、美团等在跨平台开发上均有不低的投入，甚至微信都在小程序引擎投入尝试，这说明 flutter 在这个博弈上目前是取得认可的，而 2019 年接入 flutter的平台越来越多，相信大厂们在这一问题上是经过考虑的。';

  const nodejieba = require("nodejieba");

  const result = nodejieba.extract(content, 4);

  res.send(result)
})

// 查找大小banner信息
router.get('/bannertopic', function (req, res, next) {

  db.query(`SELECT topic.tTopic,topic.tHeadImage,collect.tId,count(*) AS count from topic,user,collect WHERE topic.uId=user.uId and collect.tId=topic.tId and topic.tHeadImage is not null GROUP BY tId  ORDER BY count DESC  LIMIT 3`, [], function (results, rows) {

    var list = results

    db.query(`SELECT topic.tTopic,topic.tHeadImage,chat.tId,count(*) AS count from topic,user,chat WHERE topic.uId=user.uId and chat.tId=topic.tId and topic.tHeadImage is not null GROUP BY tId  ORDER BY count DESC  LIMIT 3`, [], function (results, rows) {
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

  if (Number(page) === 0) {
    db.query(`select topic.uId,topic.tId,topic.tTopic,topic.tTime,topic.tWords,topic.tHeadImage,topic.tRecommend,user.userAvatar,user.userName from topic,user WHERE topic.uId = user.uId order by tId desc LIMIT 8`, [], function (results, rows) {

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
    db.query(`select topic.uId,topic.tId,topic.tTopic,topic.tTime,topic.tWords,topic.tHeadImage,topic.tRecommend,user.userAvatar,user.userName from topic,user WHERE topic.uId = user.uId order by tId desc LIMIT ` + (8 + (page - 1) * 2) + `,2`, [], function (results, rows) {

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
router.get('/alluserlist', function (req, res, next) {
  db.query(`select user.uId,user.userAvatar,user.userName,user.userStatement from user order by uId desc`, [], function (results, rows) {
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

  db.query(`SELECT user.uId,topic.tTopic, topic.tContents,topic.tRecommend, topic.tTime,topic.tModel,user.userName,user.userAvatar from topic,user WHERE tId=` + topicIndex + ` and topic.uId = user.uId;`, [], function (results, rows) {

    var detail = results

    var uId = JSON.parse(results)[0].uId

    // 分词提取文章标签
    var content = getAllWord(JSON.parse(results)[0].tContents)

    var words = nodejieba.extract(content, 40);

    db.query(`
           select tId,topic.tTopic from topic,user WHERE topic.uId = user.uId and topic.uId='` + uId + `' order by tId desc LIMIT 3;`, [], function (results, rows) {
      var topicList = (results);
      res.status(200).json({
        err_code: 0,
        message: 'OK',
        results: detail,
        list: topicList,
        words: words
      })
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

// 获取标签页文章
router.get('/tagtopic', function (req, res, next) {
  var tag = req.query.tag

  var page = req.query.page


  db.query(`select topic.uId,topic.tId,topic.tTopic,topic.tTime,topic.tWords,topic.tHeadImage,topic.tModel,user.userAvatar,user.userName from topic,user WHERE topic.uId = user.uId  order by tId desc`, [], function (results, rows) {


    var res1 = (JSON.parse(results));

    for (var i = 0; i < res1.length; i++) {
      if (res1[i].tModel) {
        res1[i].tModel = (JSON.parse(res1[i].tModel));
      }
    }

    var tagArr = []
    for (var j = 0; j < res1.length; j++) {
      if (res1[j].tModel) {
        if (res1[j].tModel[0][tag] === 1) {
          tagArr.push(res1[j])
        }
      }
    }
    var rightArr = []

    if (Number(page) === 0) {
      rightArr = tagArr.slice(0, 7)

      console.log(rightArr);
      res.status(200).json({
        err_code: 0,
        message: 'OK',
        results: rightArr,
        num: tagArr.length
      })
    } else {
      rightArr = tagArr.slice((8 + (page - 1) * 2), (8 + (page - 1) * 2) + 2);
      res.status(200).json({
        err_code: 0,
        message: 'OK',
        results: rightArr,
      })
    }
  })


  /*var model = ''
  if (tag == '娱乐') {
    model = `[{"娱乐":1,"汽车":0, "职场":0, "科技":0, "房产":0, "生活":0, "互联网":0, "创投":0, "游戏":0, "c":0, "评测":0, "电影":0, "计算机":0, "体育":0,  "智能":0, "综合":0}]`
  } else if (tag == '汽车') {
    model = `[{"娱乐":0,"汽车":1, "职场":0, "科技":0, "房产":0, "生活":0, "互联网":0, "创投":0, "游戏":0, "c":0, "评测":0, "电影":0, "计算机":0, "体育":0,  "智能":0, "综合":0}]`

  } else if (tag == '职场') {
    model = `[{"娱乐":0,"汽车":0, "职场":1, "科技":0, "房产":0, "生活":0, "互联网":0, "创投":0, "游戏":0, "c":0, "评测":0, "电影":0, "计算机":0, "体育":0,  "智能":0, "综合":0}]`

  } else if (tag == '科技') {
    model = `[{"娱乐":0,"汽车":0, "职场":0, "科技":1, "房产":0, "生活":0, "互联网":0, "创投":0, "游戏":0, "c":0, "评测":0, "电影":0, "计算机":0, "体育":0,  "智能":0, "综合":0}]`

  } else if (tag == '房产') {
    model = `[{"娱乐":0,"汽车":0, "职场":0, "科技":0, "房产":1, "生活":0, "互联网":0, "创投":0, "游戏":0, "c":0, "评测":0, "电影":0, "计算机":0, "体育":0,  "智能":0, "综合":0}]`

  } else if (tag == '生活') {
    model = `[{"娱乐":0,"汽车":0, "职场":0, "科技":0, "房产":0, "生活":1, "互联网":0, "创投":0, "游戏":0, "c":0, "评测":0, "电影":0, "计算机":0, "体育":0,  "智能":0, "综合":0}]`

  } else if (tag == '互联网') {
    model = `[{"娱乐":0,"汽车":0, "职场":0, "科技":0, "房产":0, "生活":0, "互联网":1, "创投":0, "游戏":0, "c":0, "评测":0, "电影":0, "计算机":0, "体育":0,  "智能":0, "综合":0}]`

  } else if (tag == '创投') {
    model = `[{"娱乐":0,"汽车":0, "职场":0, "科技":0, "房产":0, "生活":0, "互联网":0, "创投":1, "游戏":0, "c":0, "评测":0, "电影":0, "计算机":0, "体育":0,  "智能":0, "综合":0}]`

  } else if (tag == '游戏') {
    model = `[{"娱乐":0,"汽车":0, "职场":0, "科技":0, "房产":0, "生活":0, "互联网":0, "创投":0, "游戏":1, "c":0, "评测":0, "电影":0, "计算机":0, "体育":0,  "智能":0, "综合":0}]`

  } else if (tag == '评测') {
    model = `[{"娱乐":0,"汽车":0, "职场":0, "科技":0, "房产":0, "生活":0, "互联网":0, "创投":0, "游戏":0, "c":0, "评测":1, "电影":0, "计算机":0, "体育":0,  "智能":0, "综合":0}]`

  } else if (tag == '电影') {
    model = `[{"娱乐":0,"汽车":0, "职场":0, "科技":0, "房产":0, "生活":0, "互联网":0, "创投":0, "游戏":0, "c":0, "评测":0, "电影":1, "计算机":0, "体育":0,  "智能":0, "综合":0}]`

  } else if (tag == '计算机') {
    model =   `[{"娱乐":0,"汽车":0, "职场":0, "科技":0, "房产":0, "生活":0, "互联网":0, "创投":0, "游戏":0, "c":0, "评测":0, "电影":0, "计算机":1, "体育":0,  "智能":0, "综合":0}]`

  } else if (tag == '体育') {
    model = `[{"娱乐":0,"汽车":0, "职场":0, "科技":0, "房产":0, "生活":0, "互联网":0, "创投":0, "游戏":0, "c":0, "评测":0, "电影":0, "计算机":0, "体育":1,  "智能":0, "综合":0}]`

  } else if (tag == '智能') {
    model = `[{"娱乐":0,"汽车":0, "职场":0, "科技":0, "房产":0, "生活":0, "互联网":0, "创投":0, "游戏":0, "c":0, "评测":0, "电影":0, "计算机":0, "体育":0,  "智能":1, "综合":0}]`

  } else if (tag == '综合') {
    model = `[{"娱乐":0,"汽车":0, "职场":0, "科技":0, "房产":0, "生活":0, "互联网":0, "创投":0, "游戏":0, "c":0, "评测":0, "电影":0, "计算机":0, "体育":0,  "智能":0, "综合":1}]`

  }*/

})

function getAllWord(value) {
  let description = value.replace(/(\n)/g, "");
  description = description.replace(/(\t)/g, "");
  description = description.replace(/(\r)/g, "");
  description = description.replace(/<\/?[^>]*>/g, "");
  description = description.replace(/\s*/g, "");
  return (description)
}

module.exports = router;
