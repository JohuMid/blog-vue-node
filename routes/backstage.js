var express = require('express');
var router = express.Router();
// 数据库操作模块
var db = require("./../public/javascripts/db");
// md5加密
var md5 = require('blueimp-md5')
// uui密钥
var uuid = require('uuid')
// 邮件发送模块
var nodemail = require('./../public/javascripts/nodemailer')

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
            SELECT topic.tId,user.userName,topic.tTopic,topic.tModel,topic.tRecommend,topic.tCheck,topic.tSticky,topic.tTime FROM
            topic,user WHERE topic.uId=user.uId order by tId LIMIT ` + pageNum * (currentPage - 1) + `,` + pageNum + `;`, [], function (results, rows) {

      var res1 = (JSON.parse(results));

      // 转化标签
      /*for (var i = 0; i < res1.length; i++) {
        if (res1[i].tModel) {
          res1[i].tModel = (JSON.parse(res1[i].tModel));
        }
      }
      for (var j = 0; j < res1.length; j++) {
        var tagArr = []
        if (res1[j].tModel) {
          // console.log(res1[j].tModel[0]);
          for (var key in res1[j].tModel) {
            if (res1[j].tModel[0][key] === 1) {
              tagArr.push(key)
            }
          }
        }
        res1[j].tModel = tagArr
      }*/

      var list = JSON.stringify(res1);

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
            SELECT topic.tId,user.userName,topic.tTopic,topic.tCheck,topic.tTime FROM
            topic,user WHERE topic.uId=user.uId and topic.uId= ` + uId + ` order by tId LIMIT ` + pageNum * (currentPage - 1) + `,` + pageNum + `;`, [], function (results, rows) {

      var list = results;

      db.query(`SELECT COUNT(*) FROM (SELECT topic.tId,topic.tCheck,user.userName,topic.tTopic,topic.tTime FROM
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

// 获取没审核的文章
router.post('/getcheckdata', function (req, res) {

  var body = req.body
  var pageNum = body.pageNum
  var currentPage = body.currentPage
  var uId = body.uId

  if (!uId) {

    db.query(`
            SELECT topic.tId,user.userName,user.uId,topic.tTopic,topic.tModel,topic.tRecommend,topic.tCheck,topic.tCheck,topic.tTime FROM
            topic,user WHERE topic.tCheck =0 and topic.uId=user.uId order by tId LIMIT ` + pageNum * (currentPage - 1) + `,` + pageNum + `;`, [], function (results, rows) {

      var res1 = (JSON.parse(results));

      // 转化标签
      for (var i = 0; i < res1.length; i++) {
        if (res1[i].tModel) {
          res1[i].tModel = (JSON.parse(res1[i].tModel));
        }
      }
      for (var j = 0; j < res1.length; j++) {
        var tagArr = []
        if (res1[j].tModel) {
          // console.log(res1[j].tModel[0]);
          for (var key in res1[j].tModel[0]) {
            if (res1[j].tModel[0][key] === 1) {
              tagArr.push(key)
            }
          }
        }
        res1[j].tModel = tagArr
      }

      var list = JSON.stringify(res1);

      db.query(`SELECT COUNT(*) from topic WHERE topic.tCheck =0;`, [], function (results, rows) {
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
            SELECT topic.tId,user.userName,topic.tTopic,topic.tCheck,topic.tTime FROM
            topic,user WHERE topic.uId=user.uId and topic.uId= ` + uId + ` order by tId LIMIT ` + pageNum * (currentPage - 1) + `,` + pageNum + `;`, [], function (results, rows) {

      var list = results;

      db.query(`SELECT COUNT(*) FROM (SELECT topic.tId,user.userName,topic.tTopic,topic.tCheck,topic.tTime FROM
            topic,user WHERE  topic.tCheck =0 and topic.uId=user.uId and topic.uId= ` + uId + `) AS temp;`, [], function (results, rows) {
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

// 获取标签文章
router.post('/getspecialtopic', function (req, res) {

  var body = req.body
  var pageNum = body.pageNum
  var currentPage = body.currentPage
  var tag = body.tag

  db.query(`SELECT topic.tId,user.userName,topic.tTopic,topic.tModel,topic.tTime FROM
            topic,user WHERE topic.uId=user.uId order by tId;`, [], function (results, rows) {

    var res1 = (JSON.parse(results));

    var tagArr = []
    for (var j = 0; j < res1.length; j++) {
      if (res1[j].tModel) {
        var model = JSON.parse(res1[j].tModel)
        for (var i = 0; i < model.length; i++) {
          if (tag == model[i]) {
            tagArr.push(res1[j])
          }
        }
      }
    }
    var num = tagArr.length

    tagArr = tagArr.slice(pageNum * (currentPage - 1), pageNum * (currentPage - 1) + pageNum)

    res.status(200).json({
      err_code: 0,
      message: 'OK',
      results: tagArr,
      num: num
    })
  })
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

// 获取回复数据
router.post('/getreplysdata', function (req, res) {

  var body = req.body
  var pageNum = body.pageNum
  var currentPage = body.currentPage

  db.query(`SELECT rcId,rChat,replychat.rcReply,user.userName,rcTime FROM replychat,chat,user WHERE chat.rId = replychat.rId and user.uId=replychat.uId  order by rcId LIMIT ` + pageNum * (currentPage - 1) + `,` + pageNum + `;`, [], function (results, rows) {

    var list = results;

    console.log(JSON.parse(list));

    db.query(`SELECT COUNT(*) from replychat;`, [], function (results, rows) {
      res.status(200).json({
        err_code: 0,
        message: 'OK',
        results: list,
        num: results
      })
    })
  })
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
// 删除回复
router.get('/delreply', function (req, res) {
  var rcId = req.query.rcId;

  db.query(`DELETE FROM replychat WHERE rcId = ` + rcId + ``, [], function (results, rows) {
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

// 文章推荐评级
router.get('/rate', function (req, res) {
  var tId = req.query.tId;
  var recommend = req.query.value

  db.query(`UPDATE topic SET tRecommend = ` + recommend + ` WHERE tId = ` + tId + ``, [], function (results, rows) {
    res.status(200).json({
      err_code: 0,
      message: 'OK',
    })
  })
})

// 文章置顶
router.get('/stickytopic', function (req, res) {
  var tId = req.query.tId;
  var flag = req.query.flag

  console.log(flag);


  if (Number(flag) === 1) {
    console.log(1);
    db.query(`UPDATE topic SET tSticky = 0 WHERE tId = ` + tId + ``, [], function (results, rows) {
      res.status(200).json({
        err_code: 0,
        message: 'OK',
      })
    })
  } else if (Number(flag) === 0) {
    console.log(0);
    db.query(`UPDATE topic SET tSticky = 1 WHERE tId = ` + tId + ``, [], function (results, rows) {
      res.status(200).json({
        err_code: 0,
        message: 'OK',
      })
    })
  }


  /*db.query(`UPDATE topic SET tRecommend = ` + recommend + ` WHERE tId = ` + tId + ``, [], function (results, rows) {
    res.status(200).json({
      err_code: 0,
      message: 'OK',
    })
  })*/
})


// 文章过审
router.get('/passtopic', function (req, res) {
  var tId = req.query.tId;

  db.query(`UPDATE topic SET tCheck = 1 WHERE tId = ` + tId + ``, [], function (results, rows) {
    res.status(200).json({
      err_code: 0,
      message: 'OK',
    })
  })
})

// 文章不过审
router.get('/nopasstopic', function (req, res) {
  var tId = req.query.tId;

  db.query(`UPDATE topic SET tCheck = 2 WHERE tId = ` + tId + ``, [], function (results, rows) {
    res.status(200).json({
      err_code: 0,
      message: 'OK',
    })
  })
})
// 概览数据
router.get('/getoverview', function (req, res) {

  db.query(`select COUNT(*) AS user from user union select COUNT(*) AS topic from topic union select COUNT(*) AS topic from chat union select COUNT(*) AS special from special`, [], function (results, rows) {
    res.status(200).json({
      err_code: 0,
      message: 'OK',
      results: results
    })
  })
})

// 获得管理员数据
router.post('/getadmindata', function (req, res) {
  var body = req.body
  var pageNum = body.pageNum
  var currentPage = body.currentPage

  db.query(`
            SELECT adminId,adminName,adminEmail,adminRegDate FROM
            admin order by adminId LIMIT ` + pageNum * (currentPage - 1) + `,` + pageNum + `;`, [], function (results, rows) {

    var list = results;

    db.query(`SELECT COUNT(*) AS count from admin;`, [], function (results, rows) {
      res.status(200).json({
        err_code: 0,
        message: 'OK',
        results: list,
        num: results
      })
    })
  })
})

// 获取管理员验证码
router.get('/adminvecode', function (req, res) {

  var email = req.query.userEmail;
  var nickname = req.query.userName;

  //系统生成的验证码
  var vecode = createSixNum();

  db.query(`SELECT adminEmail FROM admin where adminEmail = '` + email + `'`, [], function (results, rows) {
    //验证账号是否存在
    if (results === '[]') {
      db.query(`INSERT INTO tempvecode (userEmail,vecode,vTime)
                VALUES('` + email + `','` + vecode + `',NOW())`, [], function (results, rows) {
        // 存储临时验证码成功
        res.status(200).json({
          err_code: 0,
          message: 'OK',
        })
      })

    } else {
      res.status(200).json({
        err_code: 2,
        message: 'User already exists'
      })
    }
  })

  console.log(vecode);

  var mail = {
    // 发件人
    from: '<17782161804@163.com>',
    // 主题
    subject: 'SCF验证码',
    // 收件人
    to: email,
    // 邮件内容，HTML格式
    text: '你好' + nickname + '，用' + vecode + '作为你的管理员注册验证码'//发送验证码
  };
  nodemail(mail);

});
// 管理员注册
router.post('/adminregister', function (req, res) {
  // 1. 获取表单提交的数据
  //    req.body
  // 2. 操作数据库
  //    判断改用户是否存在 如果已存在，不允许注册
  //    如果不存在，注册新建用户
  // 3. 发送响应
  var body = req.body;

  var password = body.userPassword
  var adminname = body.userName
  var vecode = body.userVecode
  var email = body.userEmail


  // 用户输入的验证码
  db.query(`SELECT vecode from tempvecode WHERE userEmail = '` + email + `';`, [], function (results, rows) {
    // 正确验证码
    var tvecode = JSON.parse(results)[0].vecode;

    if (Number(vecode) === Number(tvecode)) {
      // 验证码输入正确

      // 账号不存在，存储用户信息
      db.query(`
                INSERT INTO admin (adminName,adminPassword,adminEmail,adminRegDate)
                VALUES('` + adminname + `','` + md5(md5(password)) + `','` + email + `',NOW())
                `, [], function (results, rows) {

        // 查出用户对应的uId
        db.query(`SELECT adminId FROM admin where adminEmail = '` + email + `'`, [], function (results, rows) {
          var uId = JSON.parse(results)[0].uId

          // 存入服务器端的session
          req.session.user = {
            token: uuid.v1(),
            adminName: adminname,
            adminId: uId,
            adminAvatar: 'avatar.png'
          };
          // 注册成功，删除临时表的验证码
          db.query(`DELETE FROM tempvecode WHERE userEmail = '` + email + `'`, [], function (results, rows) {
            res.status(200).json({
              err_code: 0,
              message: 'OK',
              results: req.session.user
            })
          })
        })
      })

    } else {
      res.status(200).json({
        err_code: 1,
        message: 'Verification code error'
      })
    }
  })


});
// 添加专题
router.post('/addspecial', function (req, res) {
  var body = req.body
  var label = body.label;
  var value = body.value;
  var floor = body.floor;
  var father = body.father;
  var secret = body.secret;
  var brief = body.brief;

  db.query(`
                select * from special where spValue = '` + value + `' or spLabel = '` + label + `'
                `, [], function (results, rows) {
    if (results === '[]') {

      if (Number(floor) === 1) {
        db.query(`
                INSERT INTO special (spLabel,spValue,spFloor,spSecret,spBrief,spTime)
                VALUES('` + label + `','` + value + `',` + Number(floor) + `,` + secret + `,'` + brief + `',NOW())
                `, [], function (results, rows) {
          res.status(200).json({
            err_code: 0,
            message: 'OK',
          })
        })
      } else {
        db.query(`
                INSERT INTO special (spLabel,spValue,spFloor,spFather,spSecret,spBrief,spTime)
                VALUES('` + label + `','` + value + `',` + Number(floor) + `,'` + father + `',` + secret + `,'` + brief + `',NOW())
                `, [], function (results, rows) {
          res.status(200).json({
            err_code: 0,
            message: 'OK',
          })
        })
      }
    } else {
      res.status(200).json({
        err_code: 11,
        message: 'Topic already exists',
      })
    }
  })
})
// 删除专题
router.post('/reducespecial', function (req, res) {
  var value = req.body.value;

  db.query(`select * from special where spLabel = '` + value + `'`, [], function (results, rows) {
    if (results === '[]') {
      res.status(200).json({
        err_code: 10,
        message: 'No matching value',
      })
    } else {
      db.query(`DELETE FROM special WHERE spLabel = '` + value + `'`, [], function (results, rows) {
        res.status(200).json({
          err_code: 0,
          message: 'OK',
        })
      })
    }
  })


  /*db.query(`DELETE FROM special WHERE rId = ` + rId + ``, [], function (results, rows) {
    res.status(200).json({
      err_code: 0,
      message: 'OK',
    })
  })*/
})
// 获取一级专题
router.get('/firstfloor', function (req, res) {
  db.query(`
                select spValue,spLabel,spSecret,spFloor FROM special
                `, [], function (results, rows) {

    /*
    * tagList: [{name: "娱乐", active: false},
          {name: "汽车", active: false},
          {name: "职场", active: false},
          {name: "科技", active: false},
          {name: "房产", active: false},
          {name: "生活", active: false},
          {name: "互联网", active: false},
          {name: "创投", active: false},
          {name: "游戏", active: false},
          {name: "评测", active: false},
          {name: "电影", active: false},
          {name: "计算机", active: false},
          {name: "体育", active: false},
          {name: "智能", active: false},
          {name: "综合", active: false}
        ],
    *
    * options: [{
          value: 'yule',
          label: '娱乐',
        }, {
          value: 'shenghuo',
          label: '生活',

        }, {
          value: 'hulianwang',
          label: '互联网',
        }, {
          value: 'keji',
          label: '科技',
        }, {
          value: 'zonghe',
          label: '综合',
        }],
    *
    *
    * */
    var one = (JSON.parse(results));

    var two = (JSON.parse(results))

    for (var i = 0; i < one.length; i++) {
      one[i]['active'] = false
    }

    var twos = []
    for (var j = 0; j < two.length; j++) {
      if (Number(two[j].spFloor) === 1) {
        twos.push(two[j])
      }
    }


    // 待修改，只要一级专题
    var second = twos.map(o => {
      if (Number(o.spFloor) === 1) {
        return {
          'label': o.spLabel,
          'value': o.spValue
        }
      }
    })


    res.status(200).json({
      err_code: 0,
      message: 'OK',
      tagList: one,
      options: second

    })
  })
})

// 获取运营数据
router.post('/operationdata', function (req, res) {
  db.query(`
                select oVisit,oRead,oLogin,oRegister FROM operation ORDER BY oId desc LIMIT 7
                `, [], function (results, rows) {

    var operation = JSON.parse(results)
    var obj = {};
    for (var i = operation.length; i >= 0; i--) {
      // console.log(operation[i]);
      for (var key in operation[i]) {
        if (obj[key] === undefined) {
          // console.log('没得');
          obj[key] = [];
          obj[key].push(operation[i][key])

        } else {
          obj[key].push(operation[i][key])
        }
      }
    }

    res.status(200).json({
      err_code: 0,
      message: 'OK',
      todayOperation: operation[0],
      operation: obj

    })
  })
})

//六位数字验证码生成函数
function createSixNum() {
  var Num = "";
  for (var i = 0; i < 6; i++) {
    Num += Math.floor(Math.random() * 10);
  }
  return Num;
}

module.exports = router;
