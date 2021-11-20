var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var helmet = require('helmet');//17章 helmetモジュールでセキュリティ対策
var session = require('express-session');//17章 GitHub 認証の実装
var passport = require('passport');//17章 GitHub 認証の実装

//18章 リレーションの設定ここから
// モデルの読み込み
var User = require('./models/user');//ユーザーモデル読み込み
var Event = require('./models/event');//スケジュールモデル読み込み
var State = require('./models/state');//進捗モデル読み込み
var Candidate = require('./models/task');//タスクモデル読み込み
var Comment = require('./models/comment');//コメントモデル読み込み

User.sync().then(() => {// Userテーブルを作成し、作成後に以下処理を実行

  Event.belongsTo(User, { foreignKey: 'createdBy' });
  // イベントがユーザーに従属していることを定義
  // EventのcreatedByをUserの外部キーに設定
  Event.sync();//Eventテーブルを作成（上で読み込んだモデルに基づいて作成される）

  Comment.belongsTo(User, { foreignKey: 'userId' });
  //コメントがユーザーに従属していることを定義
  //usersのuserIdをCommentの外部キーに設定
  Comment.sync();//Commentテーブルを作成

  State.belongsTo(User, { foreignKey: 'userId' });
  //進捗がユーザーに従属していることを定義
  Candidate.sync().then(() => {//タスク日程テーブル作成
    State.belongsTo(Candidate, { foreignKey: 'taskId' });
    //進捗がタスクに従属していることを定期
    State.sync();//進捗テーブル作成
  });
});
//18章 リレーションの設定ここまで

//17章 GitHub 認証の実装 ここから
var GitHubStrategy = require('passport-github2').Strategy;
var GITHUB_CLIENT_ID = '4757f33ace1c3c86b943';
var GITHUB_CLIENT_SECRET = '505af1e82d226b3e56d7cead1bc823c44006a37d';

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (obj, done) {
  done(null, obj);
});


passport.use(new GitHubStrategy({
  clientID: GITHUB_CLIENT_ID,
  clientSecret: GITHUB_CLIENT_SECRET,
  //callbackURL: 'http://localhost:8000/auth/github/callback'
  allbackURL: process.env.HEROKU_URL ? process.env.HEROKU_URL + 'auth/github/callback' : 'http://localhost:8000/auth/github/callback'
},
  function (accessToken, refreshToken, profile, done) {
    process.nextTick(function () {
      //18章 データベースにユーザー情報を保存ここから
      //GitHub 認証が実行された際に呼び出される処理
      User.upsert({//INSERT または UPDATE を行う(造語)
        userId: profile.id,
        username: profile.username
        //取得されたユーザー ID とユーザー名を User のテーブルに保存
      }).then(() => {
        done(null, profile);
      });
      ////18章 データベースにユーザー情報を保存ここまで
    });
  }
));
//17章 GitHub 認証の実装 ここまで

var indexRouter = require('./routes/index');
var loginRouter = require('./routes/login');
var logoutRouter = require('./routes/logout');
var eventsRouter = require('./routes/events');//19章 routes/events.jsを読み込み
var statesRouter = require('./routes/states');//20章 routes/states.jsを読み込み
var commentsRouter = require('./routes/comments');//21章 コメントの更新の Web API の実装

var app = express();
app.use(helmet());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({ secret: 'e55be81b307c1c09', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

app.use('/', indexRouter);
app.use('/login', loginRouter);
app.use('/logout', logoutRouter);
app.use('/events', eventsRouter);//19章 routes/events.jsをルーターとして/eventsのパスに登録
app.use('/events', statesRouter);//20章 routes/states.jsををルーターとして/eventsのパスに登録
app.use('/events', commentsRouter);//21章 コメントの更新の Web API の実装

app.get('/auth/github',
  passport.authenticate('github', { scope: ['user:email'] }),
  function (req, res) {
  });

app.get('/auth/github/callback',
  passport.authenticate('github', { failureRedirect: '/login' }),
  function (req, res) {
    //24章ログインできなかった際のリダイレクトここから
    var loginFrom = req.cookies.loginFrom;
    // オープンリダイレクタ脆弱性対策
    if (loginFrom &&
      loginFrom.startsWith('/')) {
      res.clearCookie('loginFrom');
      res.redirect(loginFrom);// Cookie で保存された値の URL のパスへリダイレクトする
    } else {
      res.redirect('/');
    }
    //24章ログインできなかった際のリダイレクトここまで
  });

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
