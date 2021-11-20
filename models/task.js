'use strict';//18章 sequalize の記法の定義に沿ってタスク日程のデータモデルを実装
const {sequelize, DataTypes} = require('./sequelize-loader');

const Candidate = sequelize.define(
  'tasks',
  {
    taskId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    taskName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    eventId: {
      type: DataTypes.UUID,
      allowNull: false
    }
  },
  {
    freezeTableName: true,
    timestamps: false,
    indexes: [
      {
        fields: ['eventId']//イベント ID で大量のデータから検索されることが想定されるので、インデックス
      }
    ]
  }
);

module.exports = Candidate;
