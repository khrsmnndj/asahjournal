const { DataTypes } = require("sequelize");
const sequel = require("./Database");

const Payment = sequel.define("payment", {
  user: {
    type: DataTypes.STRING,
  },
  image: {
    type: DataTypes.STRING,
    defaultValue: "default/pay.jpg",
  },
  acc: {
    type: DataTypes.BOOLEAN,
    defaultValue: 0,
  },
  price: {
    type: DataTypes.DOUBLE,
    defaultValue: 0,
  },
});

module.exports = Payment;
