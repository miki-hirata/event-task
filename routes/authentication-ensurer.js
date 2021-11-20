'use strict';
// 19章 ログイン時にしか表示されないイベント作成フォームを作成
//認証を確かめるハンドラ関数
// → さまざまな Routerオブジェクトから利用したいのでファイル分割

function ensure(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  //認証をチェックして、認証されていない場合は /login に リダイレクトを行う
  res.redirect('/login?from=' + req.originalUrl);
  //24章ログインできなかった際のリダイレクト：どこにアクセスしようとしたかを、 /login のクエリに含める
}

module.exports = ensure;