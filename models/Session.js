const sql = require("sequelize");
const sequel = require("./Database");

const Session = sequel.define("session", {
  username: {
    type: sql.STRING,
  },
  email: {
    type: sql.STRING,
  },
  expires: {
    type: sql.STRING,
  },
  data: {
    type: sql.STRING,
  },
  admin: {
    type: sql.BOOLEAN,
    defaultValue: false,
  },
  login: {
    type: sql.BOOLEAN,
    defaultValue: false,
  },
});

module.exports = Session;
