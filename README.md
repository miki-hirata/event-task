# yotei_for_textbook
N予備校「イベント調整くん」勉強用書き込みファイル

## yarn install memo
### 17章 X-Powered-By ヘッダの除去 [helmet]　
``` 
yarn add helmet@4.6.0 
```
インストール後app.jsに`app.use(helmet());`を加える
  
  
### 17章 GitHub 認証の実装 [passport/express-session]
```
yarn add passport@0.3.2  
yarn add passport-github2@0.1.9  
yarn add express-session@1.13.0
```
- passport 様々な Web サービスとの外部認証を組み込むための プラットフォームとなるライブラリ
- passport-github2 passport が GitHub の OAuth2.0 認証を利用するためのモジュール(Strategy （戦略）モジュール)
- express-session  認証した結果をセッション情報として維持するために Express でセッションを利用するモジュール
  
  
### 17章 Router オブジェクトをテストする [Jest/supertest]
```
yarn add jest@25.1.0 --dev  
yarn add supertest@3.1.0 --dev  
yarn add passport-stub@1.1.1 --dev
```
-- Node.jsのテスティングフレームワーク
-- supertest Express の Router オブジェクトをテストするモジュール
-- passport-stub passport の挙動をコントロールするモジュール
  
package.jsonの`"scripts"`に`"test": "jest --testTimeout=10000 --forceExit"`を加える
  
    
### 18章 ユーザー (user) の実装 [sequelize]
```
yarn add sequelize@6.5.0  
yarn add pg@8.5.1  
yarn add pg-hstore@2.3.3
```
  
### 19章 イベント作成フォームから送られた情報を保存 [UUID]
```
yarn add uuid@3.3.2
```
`uuid.v4()`を呼び出すと、 UUID の 文字列が取得される
    
### 21章 AJAX による進捗の更新 [webpack/babel/jQuery]
```
yarn add webpack@4.26.1 webpack-cli@3.1.2 @babel/core@7.1.6 @babel/preset-env@7.1.6 babel-loader@8.0.4 --dev  
yarn add jquery@3.4.1  
```

### 21章 AJAX による進捗の更新 [webpack/babel/jQuery]
```
yarn add webpack@4.26.1 webpack-cli@3.1.2 @babel/core@7.1.6 @babel/preset-env@7.1.6 babel-loader@8.0.4 --dev  
yarn add jquery@3.4.1  
```

## Markdown memo
```
# = 見出し1
## = 見出し2
### = 見出し3
#### = 見出し4
##### = 見出し5
###### = 見出し6
半角スペース2つ+改行 = 改行
バッククオート3つで挟み、改行 = コード
バッククォート1つで挟む = インラインコード
-を先頭 = Ul 箇条書きリスト
---を3つ = 水平線
```
=======
# yotei_for_textbook
N予備校「イベント調整くん」勉強用書き込みファイル

## yarn install memo
### 開発の準備 [express]　
``` 
yarn global add express-generator@4.16.0
express --view=pug .
```  
Dockerfile / db.Dockerfile / docker-compose.yml
作成後にインストール

  
### 17章 X-Powered-By ヘッダの除去 [helmet]　
``` 
yarn add helmet@4.6.0 
```
インストール後app.jsに`app.use(helmet());`を加える
  
  
### 17章 GitHub 認証の実装 [passport/express-session]
```
yarn add passport@0.3.2  
yarn add passport-github2@0.1.9  
yarn add express-session@1.13.0
```
- passport 様々な Web サービスとの外部認証を組み込むための プラットフォームとなるライブラリ
- passport-github2 passport が GitHub の OAuth2.0 認証を利用するためのモジュール(Strategy （戦略）モジュール)
- express-session  認証した結果をセッション情報として維持するために Express でセッションを利用するモジュール
  
  
### 17章 Router オブジェクトをテストする [Jest/supertest]
```
yarn add jest@25.1.0 --dev  
yarn add supertest@3.1.0 --dev  
yarn add passport-stub@1.1.1 --dev
```
-- Node.jsのテスティングフレームワーク
-- supertest Express の Router オブジェクトをテストするモジュール
-- passport-stub passport の挙動をコントロールするモジュール
  
package.jsonの`"scripts"`に`"test": "jest --testTimeout=10000 --forceExit"`を加える
  
    
### 18章 ユーザー (user) の実装 [sequelize]
```
yarn add sequelize@6.5.0  
yarn add pg@8.5.1  
yarn add pg-hstore@2.3.3
```
  
### 19章 イベント作成フォームから送られた情報を保存 [UUID]
```
yarn add uuid@3.3.2
```
`uuid.v4()`を呼び出すと、 UUID の 文字列が取得される
    
### 21章 AJAX による進捗の更新 [webpack/babel/jQuery]
```
yarn add webpack@4.26.1 webpack-cli@3.1.2 @babel/core@7.1.6 @babel/preset-env@7.1.6 babel-loader@8.0.4 --dev  
yarn add jquery@3.4.1  
```

### 21章 AJAX による進捗の更新 [webpack/babel/jQuery]
```
yarn add webpack@4.26.1 webpack-cli@3.1.2 @babel/core@7.1.6 @babel/preset-env@7.1.6 babel-loader@8.0.4 --dev  
yarn add jquery@3.4.1  
```

## Markdown memo
```
# = 見出し1
## = 見出し2
### = 見出し3
#### = 見出し4
##### = 見出し5
###### = 見出し6
半角スペース2つ+改行 = 改行
バッククオート3つで挟み、改行 = コード
バッククォート1つで挟む = インラインコード
-を先頭 = Ul 箇条書きリスト
---を3つ = 水平線
```