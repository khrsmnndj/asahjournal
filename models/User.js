const { DataTypes } = require("sequelize");
const sequel = require("./Database");

const User = sequel.define("user", {
  username: {
    type: DataTypes.STRING,
  },
  image: {
    type: DataTypes.STRING,
    defaultValue: "default/profile.png",
  },
  email: {
    type: DataTypes.STRING,
  },
  phone: {
    type: DataTypes.STRING,
    defaultValue: "belum",
  },
  linkedin: {
    type: DataTypes.STRING,
    defaultValue: "belum",
  },
  password: {
    type: DataTypes.STRING,
  },
  admin: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  verify: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  veriftoken: {
    type: DataTypes.STRING,
    defaultValue: null,
  },
  passwordtoken: {
    type: DataTypes.STRING,
    defaultValue: null,
  },
  wallet: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
});

module.exports = User;
