'use strict';//21章 コメントの更新の Web API の実装
const express = require('express');
const router = express.Router();
const authenticationEnsurer = require('./authentication-ensurer');
const Comment = require('../models/comment');

router.post('/:eventId/users/:userId/comments', authenticationEnsurer, (req, res, next) => {
  const eventId = req.params.eventId;
  const userId = req.params.userId;
  const comment = req.body.comment;

  Comment.upsert({//イベント ID、ユーザー ID、コメントをボディから comment というプロパティ名で取得
    eventId: eventId,
    userId: userId,
    comment: comment.slice(0, 255)
    //コメントの内容だけを 255 文字以内に
  }).then(() => {
    res.json({ status: 'OK', comment: comment });
  });
});

module.exports = router;
