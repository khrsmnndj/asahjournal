const { DataTypes } = require("sequelize");
const sequel = require("./Database");

const Withdraw = sequel.define("withdraw", {
  user: {
    type: DataTypes.STRING,
  },
  acc: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  price: {
    type: DataTypes.DOUBLE,
    defaultValue: 0,
  },
});

module.exports = Withdraw;
