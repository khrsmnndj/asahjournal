const { DataTypes } = require("sequelize");
const sequel = require("./Database");

const Post = sequel.define("post", {
  title: {
    type: DataTypes.STRING,
  },
  author: {
    type: DataTypes.STRING,
  },
  frontfile: {
    type: DataTypes.STRING,
    defaultValue: "default/ERR.pdf",
  },
  file: {
    type: DataTypes.STRING,
    defaultValue: "default/ERR.pdf",
  },
  content: {
    type: DataTypes.STRING,
  },

  version: {
    type: DataTypes.STRING,
    defaultValue: "Premium",
  },
  price: {
    type: DataTypes.DOUBLE,
    defaultValue: 0,
  },
  acc: {
    type: DataTypes.BOOLEAN,
    defaultValue: 0,
  },
  category: {
    type: DataTypes.STRING,
    defaultValue: "Umum",
  },
});

module.exports = Post;
