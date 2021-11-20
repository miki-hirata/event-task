'use strict';//18章 sequalize の記法の定義に沿って進捗のデータモデルを実装
const {sequelize, DataTypes} = require('./sequelize-loader');

const State = sequelize.define(
  'states',
  {
    taskId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false
    },
    userId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false
    },
    state: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
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
        fields: ['eventId']
      }
    ]
  }
);

module.exports = State;
