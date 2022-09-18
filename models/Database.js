const sql = require("sequelize");
const Sequelize = sql.Sequelize;

const { DB_NAME, DB_USER, DB_PASSWORD } = require("../config/config");

const db = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: "localhost",
  dialect: "mysql",
});

db.authenticate()
  .then(console.log("db connected"))
  .catch((error) => {
    console.log({ msg: error.message });
  });

module.exports = db;
