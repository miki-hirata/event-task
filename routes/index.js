'use strict';//19章 ES6 の形で全て書き換え
const express = require('express');
const router = express.Router();
const Event = require('../models/event');

/* GET home page. */
router.get('/', (req, res, next) => {
  const title = 'イベント調整くん';
  if (req.user) {
    Event.findAll({//条件があうレコードを全て取得
      where: {
        createdBy: req.user.id//自分が作成したイベントをしぼりこみ
      },
      order: [['updatedAt', 'DESC']]//作成日時順にソート
    }).then((events) => {
      res.render('index', {
        title: title,
        user: req.user,
        events: events
      });
    });
  } else {
    res.render('index', { title: title, user: req.user });
    //>users~ 19章トップ画面にログインへのリンクを作成
    //index.pugに userを割り当て
  }
});

module.exports = router;
