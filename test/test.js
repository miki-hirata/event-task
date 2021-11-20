'use strict';
const request = require('supertest');//17章 supertest の読み込み
const assert = require('assert');// 20章Node.js の assert モジュール を読み込み
const app = require('../app');//17章 テストの対象となる app.js の読み込み
const passportStub = require('passport-stub');//17章 passport-stub モジュールの読み込み
const User = require('../models/user');
const Event = require('../models/event');
const Candidate = require('../models/task');
const State = require('../models/state');//20章 進捗のモデルの読み込み
const Comment = require('../models/comment');//21章 コメントの更新の Web API の実装
const deleteEventAggregate = require('../routes/events').deleteEventAggregate;
//22章 削除機能の実装 で events に移動した関数を読み込み



describe('/login', () => {//login にアクセスした際
  beforeAll(() => {//17章 テスト前に実行したい処理をこの中に記述
    passportStub.install(app);//passportStub を app オブジェクトにインストール
    passportStub.login({ username: 'testuser' });//testuser としてログイン
  });

  afterAll(() => {//17章 テスト後に実行したい処理をこの中に記述
    passportStub.logout();//testuser からログアウト
    passportStub.uninstall(app);////passportStub をアンインストール
  });

  test('ログインのためのリンクが含まれる', () => {
    return request(app)//17章 supertest のテストの記法
      .get('/login')//login への GET リクエストを作成 
      .expect('Content-Type', 'text/html; charset=utf-8')//レスポンスヘッダの 'Content-Type' が text/html; charset=utf-8 である
      .expect(/<a href="\/auth\/github"/)//<a href="/auth/github" が HTML に含まれる
      .expect(200);//ステータスコードが 200 OK で返る
  });

  test('ログイン時はユーザー名が表示される', () => {
    return request(app)
      .get('/login')
      .expect(/testuser/)
      .expect(200);
  });
});

describe('/logout', () => {//logout にアクセスした際
  test('/ にリダイレクトされる', () => {
    return request(app)
      .get('/logout')//logout への GET リクエストを作成 
      .expect('Location', '/')// "/"への302リダイレクト1
      .expect(302);// "/"への302リダイレクト2
  });
});

//19章「イベントが作成でき、表示される」ことをテスト ここから
describe('/events', () => {
  beforeAll(() => {//テスト前に実行したい処理をこの中に記述
    passportStub.install(app);//passportStub を app オブジェクトにインストール
    passportStub.login({ id: 0, username: 'testuser' });//testuser としてログイン
  });

  afterAll(() => {//テスト後に実行したい処理をこの中に記述
    passportStub.logout();//testuser からログアウト
    passportStub.uninstall(app);////passportStub をアンインストール
  });

  test('イベントが作成でき、表示される', (done) => {
    User.upsert({ userId: 0, username: 'testuser' }).then(() => {
      // userId が 0 で username がtestuserの ユーザーをデータベース上に作成
      request(app)//expressのテストの書き方
        .post('/events')//「/events」にアクセスしたときに
        .send({//こんなパラメーターを送る 
          eventName: 'テストイベント1', 
          memo: 'テストメモ1\r\nテストメモ2', 
          tasks: 'テストタスク1\r\nテストタスク2\r\nテストタスク3' 
        })
        .expect('Location', /events/)//expect＝「こうなっていてほしい」
        //eventsが、ロケーションに含まれていてほしい（スラッシュは正規表現）
        .expect(302)//ステータスコードが302リダイレクトになっていてほしい
        .end((err, res) => {//この処理（/events」にアクセス）が終わった時の処理
          const createdEventPath = res.headers.location;//リダイレクト先のURL取得
          request(app)//getリクエストを投げる
            .get(createdEventPath)
            .expect(/テストイベント1/)
            .expect(/テストメモ1/)
            .expect(/テストメモ2/)
            .expect(/テストタスク1/)
            .expect(/テストタスク2/)
            .expect(/テストタスク3/)
            .expect(200)
            .end((err, res) => { //getリクエストを投げ終わったら
              deleteEventAggregate(createdEventPath.split('/events/')[1], done, err); 
              //イベントを削除（関数）
            });
            //20章 deleteEventAggregate という関数に イベント、そこに紐づく進捗・タスクを削除するためのメソッドを切り出し
        });
    });
  });
});
//19章「イベントが作成でき、表示される」ことをテスト ここまで

//20章 進捗更新のテストの実装　ここから
describe('/events/:eventId/users/:userId/tasks/:taskId', () => {
  beforeAll(() => {//テスト前に実行したい処理をこの中に記述
    passportStub.install(app);//passportStub を app オブジェクトにインストール
    passportStub.login({ id: 0, username: 'testuser' });;//testuser としてログイン
  });

  afterAll(() => {//テスト後に実行したい処理をこの中に記述
    passportStub.logout();//testuser からログアウト
    passportStub.uninstall(app);////passportStub をアンインストール
  });

  test('進捗が更新できる', (done) => {
    User.upsert({ userId: 0, username: 'testuser' }).then(() => {
      request(app)
        .post('/events')///events に POST を行い「イベント」と「タスク」を作成
        .send({ eventName: 'テスト進捗更新イベント1', memo: 'テスト進捗更新メモ1', tasks: 'テスト進捗更新タスク1' })
        .end((err, res) => {
          const createdEventPath = res.headers.location;
          const eventId = createdEventPath.split('/events/')[1];
          Candidate.findOne({
            where: { eventId: eventId }
          }).then((task) => {
            //「イベント」に関連するタスクを取得し、 その「タスク」に対して、 
            // 更新がされることをテスト
            const userId = 0;
            request(app)
              .post(`/events/${eventId}/users/${userId}/tasks/${task.taskId}`)
              //POST で Web API に対して欠席を出席に更新１
              .send({ state: 2 }) //POST で Web API に対して欠席を出席に更新2
              .expect('{"status":"OK","state":2}')//リクエストのレスポンスに '{"status":"OK","state":2}' が 含まれるかどうかをテスト
              .end((err, res) => {
                State.findAll({
                  //State.findAll 関数
                  //データベースから where で条件を指定した全ての進捗を取得
                  where: { eventId: eventId }
                }).then((states) => {
                  //then 関数を呼び出すことで、引数 states 
                  //進捗モデル models/state.js で定義したモデルの配列が渡され
                  assert.strictEqual(states.length, 1);//states の配列の長さは1
                  assert.strictEqual(states[0].state, 2);//states の1番目の配列の値は2
                  deleteEventAggregate(eventId, done, err);
                });
              });
          });
        });
    });
  });
});
//20章 進捗更新のテストの実装　ここまで

//21章 コメントの更新の Web API の実装 ここから
describe('/events/:eventId/users/:userId/comments', () => {
  beforeAll(() => {
    passportStub.install(app);
    passportStub.login({ id: 0, username: 'testuser' });
  });

  afterAll(() => {
    passportStub.logout();
    passportStub.uninstall(app);
  });

  test('コメントが更新できる', (done) => {
    User.upsert({ userId: 0, username: 'testuser' }).then(() => {
      request(app)
        .post('/events')
        .send({ eventName: 'テストコメント更新イベント1', memo: 'テストコメント更新メモ1', tasks: 'テストコメント更新タスク1' })
        .end((err, res) => {
          const createdEventPath = res.headers.location;
          const eventId = createdEventPath.split('/events/')[1];
          // 更新がされることをテスト
          const userId = 0;
          request(app)
            .post(`/events/${eventId}/users/${userId}/comments`)
            .send({ comment: 'testcomment' })
            .expect('{"status":"OK","comment":"testcomment"}')
            .end((err, res) => {
              Comment.findAll({
                where: { eventId: eventId }
              }).then((comments) => {
                assert.strictEqual(comments.length, 1);
                assert.strictEqual(comments[0].comment, 'testcomment');
                deleteEventAggregate(eventId, done, err);
              });
            });
        });
    });
  });
});
//21章 コメントの更新の Web API の実装 ここまで

//22章　イベントが編集できることのテスト　ここから
//ほとんど、コメントを更新するときのテストと同じ
describe('/events/:eventId?edit=1', () => {
  beforeAll(() => {
    passportStub.install(app);
    passportStub.login({ id: 0, username: 'testuser' });
  });

  afterAll(() => {
    passportStub.logout();
    passportStub.uninstall(app);
  });

  test('イベントが更新でき、タスクが追加できる', (done) => {
    User.upsert({ userId: 0, username: 'testuser' }).then(() => {
      request(app)//イベントを作成
        .post('/events')
        .send({ eventName: 'テスト更新イベント1', memo: 'テスト更新メモ1', tasks: 'テスト更新タスク1' })
        .end((err, res) => {
          const createdEventPath = res.headers.location;
          const eventId = createdEventPath.split('/events/')[1];
          //ここまではテストを実際に行うためのイベントの作成
          // 更新がされることをテスト
          request(app)
            .post(`/events/${eventId}?edit=1`)
            .send({ eventName: 'テスト更新イベント2', memo: 'テスト更新メモ2', tasks: 'テスト更新タスク2' })
            //イベントの内容を、イベント名、メモ、追加タスクという形で更新
            .end((err, res) => {
              Event.findByPk(eventId).then((s) => {//Eventデータベースを見て確認
                assert.strictEqual(s.eventName, 'テスト更新イベント2');//deepstrictEqualの方がいい
                assert.strictEqual(s.memo, 'テスト更新メモ2');
              });//「イベントが更新されたか」をテスト
              Candidate.findAll({//Candidateデータベースを見て確認
                where: { eventId: eventId },
                order: [['taskId', 'ASC']]
              }).then((tasks) => {
                assert.strictEqual(tasks.length, 2);
                assert.strictEqual(tasks[0].taskName, 'テスト更新タスク1');
                assert.strictEqual(tasks[1].taskName, 'テスト更新タスク2');
                //「タスクが追加されたか」をテスト
                deleteEventAggregate(eventId, done, err);
                // テストで作成された情報を削除
              });
            });
        });
    });
  });
});
//22章　イベントが編集できることのテスト　ここまで

//22章　「イベントに関連する全ての情報が削除できる」テスト　ここから
describe('/events/:eventId?delete=1', () => {
  beforeAll(() => {
    passportStub.install(app);
    passportStub.login({ id: 0, username: 'testuser' });
  });

  afterAll(() => {
    passportStub.logout();
    passportStub.uninstall(app);
  });

  test('イベントに関連する全ての情報が削除できる', (done) => {
    User.upsert({ userId: 0, username: 'testuser' }).then(() => {
      request(app)
        .post('/events')
        .send({ eventName: 'テスト更新イベント1', memo: 'テスト更新メモ1', tasks: 'テスト更新タスク1' })
        .end((err, res) => {
          const createdEventPath = res.headers.location;
          const eventId = createdEventPath.split('/events/')[1];

          // 進捗作成
          const promiseState = Candidate.findOne({
            where: { eventId: eventId }
          }).then((task) => {
            return new Promise((resolve) => {
              const userId = 0;
              request(app)
                .post(`/events/${eventId}/users/${userId}/tasks/${task.taskId}`)
                .send({ state: 2 }) // 出席に更新
                .end((err, res) => {
                  if (err) done(err);
                  resolve();
                });
            });
          });
          // コメント作成
          const promiseComment = new Promise((resolve) => {
            const userId = 0;
            request(app)
              .post(`/events/${eventId}/users/${userId}/comments`)
              .send({ comment: 'testcomment' })
              .expect('{"status":"OK","comment":"testcomment"}')
              .end((err, res) => {
                if (err) done(err);
                resolve();
              });
          });

          // 削除
          const promiseDeleted = Promise.all([promiseState, promiseComment]).then(() => {
            return new Promise((resolve) => {
              request(app)
                .post(`/events/${eventId}?delete=1`)
                .end((err, res) => {
                  if (err) done(err);
                  resolve();
                });
            });
          });

          // テスト
          promiseDeleted.then(() => {
            const p1 = Comment.findAll({
              where: { eventId: eventId }
            }).then((comments) => {
              assert.strictEqual(comments.length, 0);
            });
            const p2 = State.findAll({
              where: { eventId: eventId }
            }).then((states) => {
              assert.strictEqual(states.length, 0);
            });
            const p3 = Candidate.findAll({
              where: { eventId: eventId }
            }).then((tasks) => {
              assert.strictEqual(tasks.length, 0);
            });
            const p4 = Event.findByPk(eventId).then((event) => {
              assert.strictEqual(!event, true);
            });
            Promise.all([p1, p2, p3, p4]).then(() => {
              if (err) return done(err);
              done();
            });
          });
        });
    });
  });
});//22章　「イベントに関連する全ての情報が削除できる」テスト　ここまで