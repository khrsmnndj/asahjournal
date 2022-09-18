const express = require("express");
const app = express();

const {
  PORT,
  DB_NAME,
  DB_USER,
  DB_PASSWORD,
  SESS_SECRET,
  SESS_COOKIE,
} = require("./config/config");

const express_fileupload = require("express-fileupload");
const express_layout = require("express-ejs-layouts");
const cors = require("cors");
const sql = require("sequelize");
const routes = require("./routes/routes");
const mysql = require("mysql2/promise");
const rate_limit = require("express-rate-limit");
// const helmet = require("helmet");

const session = require("express-session");
const cookie_parser = require("cookie-parser");

const session_sql = require("express-mysql-session")(session);
const max_age = 24 * 60 * 60 * 1000;

const options = {
  host: "localhost",
  port: 3306,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  createDatabaseTable: false,
  schema: {
    tableName: "sessions",
    columnNames: {
      session_id: "session_id",
      expires: "expires",
      data: "data",
    },
  },
};

const connection = mysql.createPool(options);
const session_store = new session_sql(options, connection);
session_store.close();

app.use(
  session({
    name: SESS_COOKIE,
    secret: SESS_SECRET,
    resave: false,
    saveUninitialized: false,
    store: session_store,
    cookie: {
      maxAge: max_age,
      sameSite: false,
    },
  })
);
app.use(cookie_parser());

const limiter = rate_limit({
  max: 80,
  windowMs: 60 * 60 * 1000,
  message: "Too many request from this IP",
});

app.use(limiter);

// app.use(helmet(
 
//     ));

app.use(express.urlencoded({ extended: true }));
app.use(
  express_fileupload({
    useTempFiles: true,
    tempFileDir: "/tmp",
  })
);

app.use(express_layout);
app.use(express.static("public"));

app.use("/", routes);

app.use(cors());
app.disable("x-powered-by");

app.set("layout", "./layout/main");
app.set("view engine", "ejs");


app.listen(PORT, () => {
  console.log(`server listen to ${PORT}.`);
});
