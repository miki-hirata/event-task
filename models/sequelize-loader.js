'use strict'; //18章 sequelize の読み込みの定義を書く部分を別ファイルに
const {Sequelize, DataTypes} = require('sequelize');
/* const sequelize = new Sequelize(
  'postgres://postgres:postgres@db/event_arranger'
  //PostgreSQL のデータベースへのURLの書き方
  //docker-compose.yml に　"POSTGRES_DB: event_arranger"という記述があるから作られた
); */

const dialectOptions = {
  ssl: {
    require: true,
    rejectUnauthorized: false
  }
};
const sequelize = process.env.DATABASE_URL ?
  // 本番環境
  new Sequelize(
    process.env.DATABASE_URL,
    {
      logging: false,
      dialectOptions
    }
  )
  :
  // 開発環境
  new Sequelize(
      'postgres://postgres:postgres@db/event_arranger',
    {
      logging: false
    }
  );

module.exports = {
  sequelize,//sequelize が出力するSQLがログで出力される設定
  DataTypes
};
