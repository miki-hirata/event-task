'use strict';//20章 進捗更新の Web API の実装
const express = require('express');
const router = express.Router();
const authenticationEnsurer = require('./authentication-ensurer');
const State = require('../models/state');

router.post('/:eventId/users/:userId/tasks/:taskId', authenticationEnsurer, (req, res, next) => {
  const eventId = req.params.eventId;
  const userId = req.params.userId;
  const taskId = req.params.taskId;
  let state = req.body.state;
  state = state ? parseInt(state) : 0;
  //パスからイベント ID, ユーザー ID, タスク ID を受け取り、 
  //POST のリクエストに含まれる state というプロパティで

  State.upsert({
    eventId: eventId,
    userId: userId,
    taskId: taskId,
    state: state
    //データベースを更新する
  }).then(() => {
    res.json({ status: 'OK', state: state });
    //更新後は、 JSONで上記値が戻る
  });
});

module.exports = router;
