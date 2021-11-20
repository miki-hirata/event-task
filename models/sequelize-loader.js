'use strict'; //18章 sequelize の読み込みの定義を書く部分を別ファイルに
const {Sequelize, DataTypes} = require('sequelize');
const sequelize = new Sequelize(
  'postgres://postgres:postgres@db/event_arranger'
  //PostgreSQL のデータベースへのURLの書き方
  //docker-compose.yml に　"POSTGRES_DB: event_arranger"という記述があるから作られた

);


module.exports = {
  sequelize,//sequelize が出力するSQLがログで出力される設定
  DataTypes
};
