const express = require("express");
const Router = express.Router();
const control = require("../controlers/controlers");
const UserSchema = require("../models/User");
const bcrypt = require("bcryptjs");
const s3 = require("../api/s3");
const { body } = require("express-validator");
const { verifyToken } = require('../middlewares/verifyToken')


//Post
Router.get("/", control.HomePage);
Router.get("/category/:category", control.CategoryPage);
Router.get("/allpagehistory", control.AllPostPage);
Router.post(
  "/submit",
  body("title").escape(),
  body("content").escape(),
  body("author").escape(),
  body("price").trim().escape(),
  body("version").trim().escape(),
  body("category").trim().escape(),
  body("file").trim().escape(),
  body("frontfile").trim().escape(), verifyToken,
  control.CreatePost
);
Router.post(
  "/submitprofile",
  body("title").escape(),
  body("content").escape(),
  body("author").escape(),
  body("price").trim().escape(),
  body("version").trim().escape(),
  body("category").trim().escape(),
  body("file").trim().escape(),
  body("frontfile").trim().escape(), verifyToken,
  control.CreateProfilePost
);
Router.get("/postparticle/:id", verifyToken, control.PostById);
Router.get("/updatepost/:id", verifyToken, control.UpdateForm);
Router.post(
  "/updatepost/:id",
  body("title").escape(),
  body("content").escape(),
  body("price").trim().escape(),
  body("version").trim().escape(),
  body("category").trim().escape(),
  body("file").trim().escape(),
  body("frontfile").trim().escape(), verifyToken,
  control.UpdatePost
);
Router.get("/deletepost/:id", verifyToken, control.DeletePost);
Router.post("/search", body("request").trim().escape(), control.SearchItem);

//Admin
Router.get("/admin", verifyToken, control.AdminPage);
Router.get("/accept/:id", verifyToken, control.AcceptPost);
Router.get("/acceptpayment/:id", verifyToken, control.AcceptPayment);
Router.get("/acceptwithdraw/:id", verifyToken, control.WithdrawAccept);
Router.get("/sendmail", verifyToken, control.SendEmailToUser);
Router.get("/deleteuser/:id", verifyToken, control.UserDelete);

//User
Router.get("/login", control.LoginPage);
Router.post(
  "/login",
  body("email").trim().escape(),
  body("password").trim().escape(),
  control.LoginCommand
);
Router.get("/register", control.RegisterPage);
Router.post(
  "/register",
  body("username").escape(),
  body("email").trim().escape(),
  body("password").trim().escape(), verifyToken,

  control.RegisterCommand
);
Router.get("/logout", control.LogoutCommand);
Router.get("/userparticle/:id", verifyToken, control.UserById);
Router.get("/profile", verifyToken, control.LoginId);
Router.get("/userverif/:verificationcode", verifyToken, control.VerifUser);
Router.get("/updateuser/:id", verifyToken, control.UpdateUserForm);
Router.post(
  "/updateuser/:id",
  body("image").trim().escape(),
  body("email").trim().escape(),
  body("phone").trim().escape(),
  body("linkedin").trim().escape(), verifyToken,
  control.UpdateUser
);
Router.post(
  "/resetpass", body("email").trim().escape(),
  control.SendResetPasswordPage
);
Router.get("/resetpassword/:resetpass",
control.ResetPasswordPage);
Router.post("/resetpassword/:resetpass", control.ResetPassword);

//Payment
Router.get("/payment", verifyToken, control.PaymentPage);
Router.post(
  "/payment",
  body("user").escape(),
  body("image").trim().escape(),
  body("price").trim().escape(), verifyToken,
  control.PaymentCommand
);
Router.get("/paymentupdate/:id", verifyToken, control.PaymentUpdatePage);
Router.post("/paymentupdate/:id", verifyToken, control.PaymentUpdate);
Router.get("/paymentdelete/:id", verifyToken, control.PaymentDelete);
Router.get("/viewpayment/:id", verifyToken, control.ViewPayment);
Router.get("/buypost/:id", verifyToken, control.BuyPost);
Router.get("/withdraw", verifyToken, control.WithdrawPage);
Router.post(
  "/withdraw", 
  body("user").escape(),
  body("price").trim().escape(), verifyToken,
  control.WithdrawCommand
);
Router.get("/withdrawdelete/:id", verifyToken, control.WithdrawDelete);

//404
Router.get("/404", verifyToken, control.PageErr);

//Get AWS File
Router.get("/getfile/:folder/:key", verifyToken, async (req, res) => {
  let folder = req.params.folder;
  let key = req.params.key;

  try {
    let fileToSend = await s3.getFileFromS3(folder, key);
    fileToSend.pipe(res);
  } catch (error) {
    res.send({ error: "Server Error" });
  }
});

Router.get("/getfile/:folder/default/:key", verifyToken, async (req, res) => {
  let folder = req.params.folder;
  let key = req.params.key;

  try {
    let fileToSend = await s3.getFileDefaultFromS3(folder, key);
    fileToSend.pipe(res);
  } catch (error) {
    res.send({ error: "Server Error" });
  }
});

Router.get("/dev", verifyToken, (req, res)=>{
    res.render("admin/dev")
})

// Router.get("/function", (req, res) => {
//   let text = "default/items";
//   if (text.includes("default")) console.log("text contain default");
//   else console.log("text is clear");
// });

// Jangan dipakai!!!

// Router.get("/createadmin", async (req, res) => {
//   const salt = bcrypt.genSaltSync(12);
//   UserSchema.create({
//     username: "superadmin",
//     email: "superadmin@asah.com",
//     password: bcrypt.hashSync("Jangan6565!", salt),
//     admin: true,
//     verify: true,
//   }).then((data) => {
//     if (data) console.log(`Admin ${data.username} created.`);
//   });
// });

module.exports = Router;
