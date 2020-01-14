var express = require('express');
var router = express.Router();

// 邮件发送模块
var nodemail = require('./../public/javascripts/nodemailer')
// md5加密
var md5 = require('blueimp-md5')
// uui密钥
var uuid = require('uuid')
//引入数据库封装模块
var db = require("./../public/javascripts/db");

/* GET users listing. */
router.get('/', function (req, res, next) {
  res.send('respond with a resource');
});


//用来存验证码的数组
router.get('/vecode', function (req, res) {

  var email = req.query.userEmail;
  var nickname = req.query.userName;

  //系统生成的验证码
  var vecode = createSixNum();

  db.query(`SELECT userEmail FROM user where userEmail = '` + email + `'`, [], function (results, rows) {
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
  // 待修改
  /*arr = [];
  arr.push(vecode);*/

  // console.log(arr);
  var mail = {
    // 发件人
    from: '<17782161804@163.com>',
    // 主题
    subject: 'SCF验证码',
    // 收件人
    to: email,
    // 邮件内容，HTML格式
    text: '你好' + nickname + '，用' + vecode + '作为你的登录验证码'//发送验证码
  };
  nodemail(mail);

});

router.post('/register', function (req, res) {
  // 1. 获取表单提交的数据
  //    req.body
  // 2. 操作数据库
  //    判断改用户是否存在 如果已存在，不允许注册
  //    如果不存在，注册新建用户
  // 3. 发送响应
  var body = req.body;

  var password = body.userPassword
  var username = body.userName
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
                INSERT INTO user (userName,userPassword,userEmail,userAvatar,userRegDate)
                VALUES('` + username + `','` + md5(md5(password)) + `','` + email + `','avatar.png',NOW())
                `, [], function (results, rows) {

        // 查出用户对应的uId
        db.query(`SELECT uId FROM user where userEmail = '` + email + `'`, [], function (results, rows) {
          var uId = JSON.parse(results)[0].uId

          // 存入服务器端的session
          req.session.user = {
            token: uuid.v1(),
            userName: username,
            uId: uId,
            userAvatar: 'avatar.png'
          };
          // 注册成功，删除临时表的验证码
          db.query(`DELETE FROM tempvecode WHERE userEmail = '` + email + `'`, [], function (results, rows) {
            res.status(200).json({
              err_code: 0,
              message: 'OK',
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

router.post('/login', function (req, res) {
  var body = req.body;

  var isAdmin = body.isAdmin
  var password = body.userPassword
  var email = body.userEmail

  console.log(isAdmin);

  if (!isAdmin) {
    db.query(`SELECT * FROM user where userEmail = '` + email + `' and userPassword ='` + md5(md5(password)) + `'`, [], function (results, rows) {
      //验证账号是否存在
      if (results === '[]') {
        res.status(200).json({
          err_code: 3,
          message: 'Account or password incorrect'
        })
      } else {
        results = JSON.parse(results)[0];

        // 存入服务器端的session
        req.session.user = {
          token: uuid.v1(),
          userName: results.userName,
          uId: results.uId,
          userAvatar: results.userAvatar
        };
        res.status(200).json({
          err_code: 0,
          message: 'OK',
          user: req.session.user
        })
      }
    })
  } else {
    db.query(`SELECT * FROM admin where adminEmail = '` + email + `' and adminPassword ='` + md5(md5(password)) + `'`, [], function (results, rows) {
      if (results === '[]') {
        res.status(200).json({
          err_code: 3,
          message: 'Account or password incorrect'
        })
      } else {
        results = JSON.parse(results)[0];

        req.session.user = {
          token: uuid.v1(),
          adminName: results.adminName,
          adminId: results.adminId,
          adminAvatar: 'avatar.png'
        };
        res.status(200).json({
          err_code: 0,
          message: 'OK',
          user: req.session.user
        })
      }
    })
  }
})


// 密码修改验证码数组

// 忘记密码验证码邮件发送
router.get('/forvecode', function (req, res, next) {

  var email = req.query.userNewEmail;

  db.query(`SELECT uId FROM user where userEmail = '` + email + `'`, [], function (results, rows) {
    //验证账号是否存在
    if (results === '[]') {
      res.status(200).json({
        err_code: 4,
        message: 'Account does not exist'
      })
    } else {
      var revecode = createSixNum();

      db.query(`INSERT INTO tempvecode (userEmail,vecode,vTime)
                VALUES('` + email + `','` + revecode + `',NOW())`, [], function (results, rows) {
        // 存储临时忘记密码验证码成功
        res.status(200).json({
          err_code: 0,
          message: 'OK',
        })
      })

      var mail = {
        // 发件人
        from: '<17782161804@163.com>',
        // 主题
        subject: 'SCF密码修改验证码',
        // 收件人
        to: email,
        // 邮件内容，HTML格式
        text: '你好' + '，用' + revecode + '作为你的密码修改验证码'//发送验证码
      };
      // 发送邮件
      nodemail(mail);
    }
  })

});
// 重置密码
router.post('/forgetpsd', function (req, res, next) {

    var body = req.body;

    // 用户输入的验证码
    var irevecode = body.userNewVecode;

    // console.log(irevecode);
    // console.log(rearr);

    var email = body.userNewEmail;

    db.query(`SELECT vecode from tempvecode WHERE userEmail = '` + email + `';`, [], function (results, rows) {
      // 正确验证码
      var tvecode = JSON.parse(results)[0].vecode;

      // 验证码不正确
      if (Number(tvecode) !== Number(irevecode)) {
        res.status(200).json({
          err_code: 1,
          message: 'Verification code error'
        })
      } else {

        // 用户输入新密码
        var repsd = body.userNewPassword;

        db.query(`
                UPDATE user SET userPassword='` + md5(md5(repsd)) + `' WHERE userEmail='` + email + `';
            `, [], function (results, rows) {

          results = JSON.parse(results)

          if (results.affectedRows === 1) {
            db.query(`DELETE FROM tempvecode WHERE userEmail = '` + email + `'`, [], function (results, rows) {
              res.status(200).json({
                err_code: 0,
                message: 'OK',
              })
            })
          } else {
            res.status(200).json({
              err_code: 5,
              message: 'Failed to reset password'
            });
          }
        })
      }
    })
  }
);
// 退出登录
router.get('/logout', function (req, res) {
  req.session.user = null;
  res.status(200).json({
    err_code: 7,
    message: 'User logs out'
  });
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
