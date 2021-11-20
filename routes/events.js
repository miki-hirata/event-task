'use strict';// 19章 ログイン時にしか表示されないイベント作成フォームを作成
const express = require('express');
const router = express.Router();
const authenticationEnsurer = require('./authentication-ensurer');
// 19章認証を確かめるハンドラ関数 routes/authentication-ensurer.js が ある前提で実装
const uuid = require('uuid');//19章 UUID の 文字列を取得（yarn add uuid@3.3.2でインストール）
const Event = require('../models/event');
const Candidate = require('../models/task');
const User = require('../models/user');//19章 ユーザーのデータモデル読み込み
const State = require('../models/state');//20章 進捗のモデルの読み込み
const Comment = require('../models/comment');//21章 コメントの表示の実装
const csrf = require('csurf');//24章 CSRF 脆弱性対策
const csrfProtection = csrf({ cookie: true });//24章 CSRF 脆弱性対策

const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
dayjs.extend(utc);
dayjs.extend(timezone);

router.get('/new', authenticationEnsurer, csrfProtection, (req, res, next) => {//[csrfProtection]24章 CSRF 脆弱性対策
  res.render('new', { user: req.user, csrfToken: req.csrfToken() });
});

//19章 イベント作成フォームから送られた情報を保存ここから
router.post('/', authenticationEnsurer, csrfProtection, (req, res, next) => {//[csrfProtection]24章 CSRF 脆弱性対策
  const eventId = uuid.v4();;//イベントID生成（uuid.v4() でUUID の文字列が取得）
  const updatedAt = new Date();//更新日時生成
  Event.create({//イベントをデータベース内に保存
    eventId: eventId,
    eventName: req.body.eventName.slice(0, 255) || '（名称未設定）',
    //イベント名は255字以内　空の場合（名称未設定）としてイベント名を保存　
    eventDate: req.body.eventDate,
    eventPlace: req.body.eventPlace.slice(0, 255) || '（名称未設定）',
    //会場名は255字以内　空の場合（名称未設定）としてイベント名を保存　
    memo: req.body.memo,
    createdBy: req.user.id,
    updatedAt: updatedAt
  }).then((event) => {//イベントを保存し終わったら実行
    createTasksAndRedirect(parseCandidateNames(req), eventId, res);
  });//22章 イベント編集を反映させる実装でまとめて関数化
});
//19章 イベント作成フォームから送られた情報を保存ここまで

//19章 イベントと進捗表の表示画面を作成 ここから
//21章 で以下リファクタリング
router.get('/:eventId', authenticationEnsurer, (req, res, next) => {
  //個別のスケジュールにアクセスしたときの処理
  let storedEvent = null;//[使い回し用]他の Promise オブジェクトへの処理をまたぎたいので
  let storedTasks = null;//[使い回し用]then に渡す関数のスコープの外側に変数宣言
  Event.findOne({//[sequelize]条件を満たす最初のデータ取得
    include: [//[sequelize]テーブルのjoinをするときはincludeを使う
      {
        model: User,//スケジュールとユーザーのテーブルをジョイン（app.jsのcreated by 設定が使われる）
        attributes: ['userId', 'username']//ユーザーテーブル内の、どのカラムを使うか
      }],
    where: {
      eventId: req.params.eventId//リクエストされているスケジュールIDと同じイベント
    },
    order: [['updatedAt', 'DESC']]//findOneなのでいらない
  }).then((event) => {//データ取得が成功したら、「event」として引数を渡す（時間かかる処理なので、thenでつなげる）
    if (event) {
      event.formattedEventDate = dayjs(event.eventDate).tz('Asia/Tokyo').format('YYYY/MM/DD HH:mm');
      storedEvent = event;//[使い回し用]
      return Candidate.findAll({//[sequelize]条件を満たす全てのデータ取得
        where: { eventId: event.eventId },//リクエストされているスケジュールIDと同じタスク
        order: [['taskId', 'ASC']]//タスクＩＤの昇順→作られた順
      });
    } else {
      const err = new Error('指定されたイベントは見つかりません');
      err.status = 404;
      next(err);
    }//19章 イベントと進捗表の表示画面を作成 ここまで
  }).then((tasks) =>{//ひとつ前のthen（）で見つかったタスク群を「tasks」として、引数に
    //20章 進捗のモデルの読み込みここから
    // データベースからそのイベントの全ての進捗を取得する
    storedTasks = tasks;//[使い回し用]
    return State.findAll({//[sequelize]条件を満たす全てのデータ取得
      include: [
        {
          model: User,
          attributes: ['userId', 'username']
          //後にユーザー情報を利用するため、ユーザー名もテーブルの結合をして取得
        }
      ],
      where: { eventId: storedEvent.eventId },//リクエストされているスケジュールIDと同じ進捗
      order: [[User, 'username', 'ASC'], ['"taskId"', 'ASC']]
      //ユーザー名の昇順、タスク ID の昇順
    });
  }).then((states) => {//ひとつ前のthen（）で見つかった進捗群を「states」として、引数に
    // 進捗 MapMap(キー:ユーザー ID, 値:進捗Map(キー:タスク ID, 値:進捗)) を作成する
    // 進捗のデータがあったものだけを データとして入れ子の連想配列の中に保存
    const stateMapMap = new Map(); // key: userId, value: Map(key: taskId, state)
    states.forEach((a) => {//進捗群をひとつずつ取り出して処理
      const map = stateMapMap.get(a.user.userId) || new Map();
      map.set(a.taskId, a.state);
      stateMapMap.set(a.user.userId, map);
    });

    // 閲覧ユーザーと進捗に紐づくユーザーからユーザー Map (キー:ユーザー ID, 値:ユーザー) を作る
    const userMap = new Map(); // key: userId, value: User
    userMap.set(parseInt(req.user.id), {
      //進捗のデータを 1 つでも持っていたユーザーをユーザー Mapに含める
      isSelf: true,//閲覧ユーザーである
      userId: parseInt(req.user.id),
      username: req.user.username
    });
    states.forEach((a) => {//進捗群をひとつずつ取り出して処理（2回目？）
      userMap.set(a.user.userId, {
        isSelf: parseInt(req.user.id) === a.user.userId, // 閲覧ユーザー自身であるかを含める
        userId: a.user.userId,
        username: a.user.username
      });
    });

    // 全ユーザー、全タスクで二重ループしてそれぞれの進捗の値がない場合には、「欠席」を設定する
    const users = Array.from(userMap).map((keyValue) => keyValue[1]);
    users.forEach((u) => {
      storedTasks.forEach((c) => {
        const map = stateMapMap.get(u.userId) || new Map();
        const a = map.get(c.taskId) || 0; 
        // 進捗情報が存在しない場合 デフォルト値0 を利用 0=欠席
        map.set(c.taskId, a);
        stateMapMap.set(u.userId, map);
      });
    });
    //20章 進捗のモデルの読み込みここまで
    
    //21章 コメントの表示の実装ここから
    // コメント取得
    return Comment.findAll({//[sequelize]条件を満たす全てのデータ取得
      where: { eventId: storedEvent.eventId }//リクエストされているスケジュールIDと同じコメント
      //イベントIDで絞り込んだすべてのコメント
    }).then((comments) => {//データ取得が成功したら、「comments」と名付けて処理を行う
      const commentMap = new Map();  // key: userId, value: comment
      comments.forEach((comment) => {
        commentMap.set(comment.userId, comment.comment);
      });//連想配列 commentMap に格納
      res.render('event', {//event.pugに以下の値を渡して表示させる
        user: req.user,
        event: storedEvent,
        tasks: storedTasks,
        users: users,
        stateMapMap: stateMapMap,
        commentMap: commentMap
      });//テンプレートに commentMap というプロパティ名で割り当ててテンプレートを描画
      //21章 コメントの表示の実装ここまで
    });
  });
});

// 22章イベント編集フォームの実装ここから
router.get('/:eventId/edit', authenticationEnsurer, csrfProtection, (req, res, next) => {
  //getアクセスしたとき
  //[csrfProtection]24章 CSRF 脆弱性対策\
  //URL は、イベント表示のページの末尾に /edit を加えたもの
  Event.findOne({//[sequelize]条件を満たす最初のデータ取得
    where: {
      eventId: req.params.eventId
    }//指定されたイベント ID のイベントを取得
  }).then((event) => {
    if (isMine(req, event)) { // 作成者のみが編集フォームを開ける
      //isMine という関数を別途用意して、自身のイベントであればその後の処理を行う
      Candidate.findAll({//タスクを取得
        where: { eventId: event.eventId },
        order: [['"taskId"', 'ASC']]//作成順に並ぶように taskId の昇順で
      }).then((tasks) => {
        res.render('edit', {//テンプレート edit を描画
          //！これらデータをpugに送るために、逆算でデータを取得する（と考えたら分かりやすい！）
          user: req.user,
          event: event,
          tasks: tasks,
          csrfToken: req.csrfToken()//24章 CSRF 脆弱性対策
        });
      });
    } else {//自分のスケジュールじゃなかったら、編集しないでね
      const err = new Error('指定されたイベントがない、または、イベントを編集する権限がありません');
      err.status = 404;//404 Not Found のステータスを返す
      next(err);
    }
  });
});

function isMine(req, event) {//isMine という関数の別途用意
  return event && parseInt(event.createdBy) === parseInt(req.user.id);
  //スケジュールがあったら＆＆の後の処理
  //ParseIntで数値型にして比較（型をそろえた方が安全）
  //リクエストとイベントのオブジェクトを受け取り、
  //そのイベントが自分のものであるかの 真偽値を返す関数
}
// 22章イベント編集フォームの実装ここまで

//22章 イベント編集を反映させる実装ここから
router.post('/:eventId', authenticationEnsurer, csrfProtection, (req, res, next) => {//[csrfProtection]24章 CSRF 脆弱性対策
  Event.findOne({//[sequelize]条件を満たす最初のデータ取得
    where: {
      eventId: req.params.eventId
    }//イベント ID でイベントを取得
  }).then((event) => {
    if (event && isMine(req, event)) {
      //該当スケジュールが存在し、かつ（&&）
      //自分のスケジュールの場合
      if (parseInt(req.query.edit) === 1) {//クエリのeditが1のときのリクエスト
        const updatedAt = new Date();
        event.update({//イベントの更新（ SQL における UPDATE 文に対応）
          eventId: event.eventId,//変わらないからなくてもOK
          eventName: req.body.eventName.slice(0, 255) || '（名称未設定）',
          //これ書くの2回目だから、本当はよくない
          eventDate: req.body.eventDate,
          eventPlace: req.body.eventPlace.slice(0, 255) || '（名称未設定）',
          memo: req.body.memo,
          createdBy: req.user.id,
          updatedAt: updatedAt//今更新したよ　updatedAt: new Date()　でも良い
        }).then((event) => {
          // 追加されているかチェック
          const taskNames = parseCandidateNames(req);//タスク日程の配列をパース(分解/解釈)する関数
          if (taskNames) {//追加タスクがあれば
            createTasksAndRedirect(taskNames, event.eventId, res);
            //関数は下部記載
          } else {
            res.redirect('/events/' + event.eventId);//ただのリダイレクト
          }
        });
        //22章 削除機能の実装 ここから
      } else if (parseInt(req.query.delete) === 1) {//dlete=1 というクエリが渡された時
        deleteEventAggregate(req.params.eventId, () => {
          res.redirect('/');//イベントを消してからリダイレクト
        });//22章 削除機能の実装 ここまで
      } else {//例えばedit2だったら（普通ないけど）
        const err = new Error('不正なリクエストです');
        err.status = 400;
        next(err);
      }
    } else {
      const err = new Error('指定されたイベントがない、または、編集する権限がありません');
      err.status = 404;
      next(err);
    }
  });
});

//22章 削除機能の実装 ここから
//deleteEventAggregate関数はtest/test.jsと共有 実際のコードで使いたいから持ってきました！
function deleteEventAggregate(eventId, done, err) {//エラーが出てたらdone(終了)
  const promiseCommentDestroy = Comment.findAll({
    where: { eventId: eventId }
  }).then((comments) => {
    return Promise.all(comments.map((c) => { return c.destroy(); }));//map(全部処理)でdestroy（消す）
  });// Promise.all = 全部終わったら

  State.findAll({
    where: { eventId: eventId }
  }).then((states) => {
    const promises = states.map((a) => { return a.destroy(); });
    return Promise.all(promises);
  }).then(() => {
    return Candidate.findAll({
      where: { eventId: eventId }
    });
  }).then((tasks) => {
    const promises = tasks.map((c) => { return c.destroy(); });
    promises.push(promiseCommentDestroy);
    return Promise.all(promises);
  }).then(() => {
    return Event.findByPk(eventId).then((s) => { return s.destroy(); });
  }).then(() => {
    if (err) return done(err);
    done();
  });
}

router.deleteEventAggregate = deleteEventAggregate;
//他の場所でも使えるように、ルーターに登録！
//22章 削除機能の実装 ここまで

function createTasksAndRedirect(taskNames, eventId, res) {
  //使いまわしのために関数に
  //タスク日程の配列、イベント ID 、レスポンスオブジェクトを受け取り、 
  //タスクの作成とリダイレクトを行う関数
  const tasks = taskNames.map((c) => {//ひとつひとつ取り出してオブジェクトに変換
    return {
      taskName: c,
      eventId: eventId
    };
  });//tasks はオブジェクトの配列
  Candidate.bulkCreate(tasks).then(() => {//bulkCreateは,createの配列版（データベースの行作成）
    res.redirect('/events/' + eventId);
  });
}

function parseCandidateNames(req) {
  //タスクデータの空行を削除しつつ配列で返す
  return req.body.tasks.trim().split('\n').map((s) => s.trim()).filter((s) => s !== "");
  //map() ひとつひとつ取り出して適用
  //trim() 空白を削除　実は一つ目いらない
  //split() 配列に分割　\nは改行
  //filter() 条件に当てはまるものだけ抽出
}
//22章 イベント編集を反映させる実装ここまで
module.exports = router;
