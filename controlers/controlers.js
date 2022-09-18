//Models
const PaySchema = require("../models/Payment");
const PostSchema = require("../models/Post");
const UserSchema = require("../models/User");
const WithdrawSchema = require("../models/Withdraw");

//API
const sendMail = require("../api/sendMail");
const Today = require("../api/datenow").Calendar;
const s3 = require("../api/s3");
const { generateToken } = require('../api/generateToken')

//Modules
const { Op } = require("sequelize");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require('jsonwebtoken')
const { JWT_KEY } = require('../config/config');


exports.HomePage = async (req, res) => {
  const session = req.session.user;
  const latest = await PostSchema.findAll(
    { where: { acc: true } },
    { limit: 18, order: [["updatedAt", "DESC"]] }
  );
  try {
    if (session) {
      const User = await UserSchema.findOne({
        where: {
          id: session.id,
        },
      });
      const Post = await PostSchema.findAll({
        where: {
          author: session.username,
          acc: true,
        },
      });
      return res.render("homepage/homelogin", {
        User,
        Post,
        latest,
        admin: User.admin,
      });
    } else {
      return res.render("homepage/homelogout", { latest });
    }
  } catch (error) {
    return res.redirect("/404");
  }
};

exports.AllPostPage = async (req, res) => {
  const session = req.session.user;
  const catKedokteran = "Kedokteran";
  const catTeknik = "Teknik";
  const catUmum = "Umum";

  try {
    const kedokteran = await PostSchema.findAll(
      { where: { acc: true, category: catKedokteran } },
      { limit: 6, order: [["updatedAt", "DESC"]] }
    );

    const teknik = await PostSchema.findAll(
      { where: { acc: true, category: catTeknik } },
      { limit: 6, order: [["updatedAt", "DESC"]] }
    );
    const umum = await PostSchema.findAll(
      { where: { acc: "Accepted", category: catUmum } },
      { limit: 6, order: [["updatedAt", "DESC"]] }
    );

    if (session) {
      const User = await UserSchema.findByPk(session.id);
      const Post = await PostSchema.findAll(
        { where: { author: session.username, acc: true } },
        { limit: 6, order: [["updatedAt", "DESC"]] }
      );
      // res.json({latest})
      return res.render("searchpage/allpostin", {
        kedokteran,
        catKedokteran,
        teknik,
        catTeknik,
        umum,
        catUmum,
        User,
        Post,
        admin: User.admin,
      });
    } else {
      // res.json({latest});
      return res.render("searchpage/allpostout", {
        kedokteran,
        catKedokteran,
        teknik,
        catTeknik,
        umum,
        catUmum,
      });
    }
  } catch (error) {
    return res.redirect("/404");
  }
};

exports.CategoryPage = async (req, res) => {
  const session = req.session.user;
  const categoryInput = req.params.category;

  try {
    const category = await PostSchema.findAll(
      { where: { acc: true, category: categoryInput } },
      { order: [["updatedAt", "DESC"]] }
    );

    if (session) {
      const User = await UserSchema.findByPk(session.user_id);
      const Post = await PostSchema.findAll(
        { where: { author: session.username, acc: true } },
        { order: [["updatedAt", "DESC"]] }
      );
      // res.json({latest})
      return res.render("searchpage/categorypagein", {
        category,
        categoryInput,
        User,
        Post,
        admin: User.admin,
      });
    } else {
      // return res.json({latest})
      return res.render("searchpage/categorypageout", { category, categoryInput });
    }
  } catch (error) {
    return res.redirect("/404");
  }
};

exports.LoginPage = async (req, res) => {
  try {
    return res.render("profile/loginpage");
  } catch (error) {
    return res.redirect("/404");
  }
};

exports.RegisterPage = async (req, res) => {
  try {
    return res.render("profile/registerpage");
  } catch (error) {
    return res.redirect("/404");
  }
};

exports.LoginCommand = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    UserSchema.findOne({ where: { email: email } }).then((user) => {
      if (!user)
        return res.status(400).render("profile/loginprob", {
          dataprob: "User tidak ditemukan, ayo registrasi!",
        });
      else
        bcrypt.compare(password, user.password).then((isMatch) => {
          if (!isMatch) {
            return res.status(400).render("profile/loginprob", {
              dataprob: "Masukan email atau password yang sesuai!",
            });
          } else {
            const sessUser = {
              id: user.id,
              username: user.username,
              email: user.email,
              admin: user.admin,
              login: true,
            };
              req.session.user = sessUser;

              let token = generateToken(sessUser, JWT_KEY);
              res.cookie('token', token, {
                httpOnly: true,
                maxAge: 60 * 60 * 1000
              });
            
              return res.redirect("/");
          }
        });
    });
  } catch (error) {
    return res.redirect("/404");
  }
};

exports.RegisterCommand = async (req, res) => {
  try {
    const username = req.body.username;
    const email = req.body.email;
    const password = req.body.password;
    const Username = await UserSchema.findOne({
      where: { username: username },
    });
    const Email = await UserSchema.findOne({ where: { email: email } });

    if (password.length < 8) {
      // return res.status(200).send('<h1>Password minimal 8 karakter!</h1><br><h3>Lanjutkan <a href="/register">registrasi</a>.</h3>')
      return res.status(400).render("profile/registerprob", {
        dataprob: "Password minimal 8 karakter!",
      });
    } else if (Username) {
      return res.status(400).render("profile/registerprob", {
        dataprob: "Username sudah terdaftar!",
      });
    } else if (Email) {
      res
        .status(400)
        .render("profile/registerprob", { dataprob: "Email sudah terdaftar!" });
    } else {
      const salt = bcrypt.genSaltSync(12);
      UserSchema.create({
        username: req.body.username,
        email: req.body.email,
        password: bcrypt.hashSync(req.body.password, salt),
        veriftoken: crypto.randomBytes(20).toString("hex"),
      }).then((data) => {
        if (data) {
          
          const token = data.veriftoken
          let subject = "Email Verification";
          let html = `<div style="display:flex;justify-content: center;"><h1>Asah Team</h1></div>
                        <div>
                        <h4>Verifikasi akunmu dengan membuka link berikut <a href="https://www.asahjournal.com/userverif/${token}">link</a>.</h4>
                        <p>atau salin link berikut sebagai alternatif:</p>
                        <p>https://www.asahjournal.com/userverif/${token}</p>
                        </div>`;
          sendMail(data.email, subject, html);
          return res.redirect("/login");
        }
      });
    }
  } catch (error) {
    return res.redirect("/404");
  }
};

exports.LogoutCommand = async (req, res) => {
  const session = req.session.user;
  req.session.destroy( async (err) => {
    if (err) throw err;
      await res.clearCookie("session-id");
      await res.clearCookie('token');
      return res.redirect("/");
  });
};

exports.CreatePost = async (req, res) => {
  const session = req.session.user;
  const UserLogin = await UserSchema.findByPk(session.id);
  const Username = UserLogin.username;

  try {
    let frontFile;
    let uploadFile;
    let newfrontfileName;
    let newuploadfileName;

    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).send("No files were uploaded.");
    }

    frontFile = req.files.frontfiles;
    newfrontfileName = Date.now() + frontFile.name;
    uploadFile = req.files.upload;
    newuploadfileName = Date.now() + uploadFile.name;

    s3.uploadToS3(
      "Articles",
      frontFile,
      newfrontfileName.replace(" ", "_"),
      (error, data) => {
        if (data) {
          s3.uploadToS3(
            "Articles",
            uploadFile,
            newuploadfileName.replace(" ", "_"),
            (error, data) => {
              if (data) console.log({ mg: "file uploaded successfully" });
            }
          );
          PostSchema.create({
            title: req.body.title,
            content: req.body.content,
            author: Username,
            price: req.body.price,
            version: req.body.payfor,
            category: req.body.category,
            file: newuploadfileName.replace(" ", "_"),
            frontfile: newfrontfileName.replace(" ", "_"),
          }).then(res.redirect("/"));
        } else {
          return res.redirect("/");
        }
      }
    );
  } catch (error) {
    return res.redirect("/404");
  }
};

exports.CreateProfilePost = async (req, res) => {
  const session = req.session.user;
  const UserLogin = await UserSchema.findByPk(session.id);
  const Username = UserLogin.username;

  try {
    let frontFile;
    let uploadFile;
    let newfrontfileName;
    let newuploadfileName;

    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).send("No files were uploaded.");
    }

    frontFile = req.files.frontfiles;
    newfrontfileName = Date.now() + frontFile.name;
    uploadFile = req.files.upload;
    newuploadfileName = Date.now() + uploadFile.name;

    s3.uploadToS3(
      "Articles",
      frontFile,
      newfrontfileName.replace(" ", "_"),
      (error, data) => {
        if (data) {
          s3.uploadToS3(
            "Articles",
            uploadFile,
            newuploadfileName.replace(" ", "_"),
            (error, data) => {
              if (data) console.log({ mg: "file uploaded successfully" });
            }
          );
          PostSchema.create({
            title: req.body.title,
            content: req.body.content,
            author: Username,
            price: req.body.price,
            version: req.body.payfor,
            category: req.body.category,
            file: newuploadfileName.replace(" ", "_"),
            frontfile: newfrontfileName.replace(" ", "_"),
          }).then(res.redirect("/profile"));
        } else {
          return res.redirect("/");
        }
      }
    );
  } catch (error) {
    return res.redirect("/404");
  }
};

exports.PostById = async (req, res) => {
  const id = req.params.id;
  const session = req.session.user;

  const Post = await PostSchema.findByPk(id);
  const postauthor = Post.author;
  const Author = await UserSchema.findOne({ where: { username: postauthor } });

  if (session) {
    const User = await UserSchema.findByPk(session.id);
    if (Post.acc == false) {
      if (session.admin || session.username == postauthor) {
        return res.render("file/viewfile", {
          admin: session.admin,
          Post,
          Author,
          User,
          session: session,
        });
      } else {
        return res.redirect("/404");
      }
    } else {
      return res.render("file/viewfile", {
        admin: session.admin,
        Post,
        Author,
        User,
        session: session,
      });
    }
  } else {
    return res.redirect("/login");
  }
};

exports.UserById = async (req, res) => {
  const id = req.params.id;
  const session = req.session.user;

  const Author = await UserSchema.findByPk(id);
  const authorUsername = Author.username;
  const Post = await PostSchema.findOne({ author: authorUsername });

  if (session.user) {
    const User = await UserSchema.findByPk(session.id);
    return res.render("profile/authorpage", { Author, User, Post, Today });
  } else {
    return res.redirect("/login");
  }
};

//ROUTER

exports.UpdateForm = async (req, res) => {
  const id = req.params.id;
  const session = req.session.user;
  const Post = await PostSchema.findByPk(id);

  if (session) {
    if (session.username == Post.author || session.admin) {
      return res.render("file/updateform", { Post, Today, admin: session.admin });
    } else {
      return res.redirect("/404");
    }
  } else {
    return res.redirect("/login");
  }
};

exports.UpdatePost = async (req, res) => {
  const id = req.params.id;
  const session = req.session.user;
  const Post = await PostSchema.findByPk(id);

  try {
    let frontFile;
    let uploadFile;
    let newfrontfileName;
    let newuploadfileName;

    if (!req.files || Object.keys(req.files).length === 0) {
      PostSchema.update(
        {
          title: req.body.title,
          content: req.body.content,
          price: req.body.price,
          version: req.body.payfor,
          category: req.body.category,
          frontfile: req.body.frontfiles,
          file: req.body.upload,
        },
        {
          where: {
            id: id,
          },
        }
      )
        .then((data) => {
          if (!data) {
            return res.redirect("/404");
          } else if (session.admin) {
            return res.redirect("/admin");
          } else {
            return res.redirect("/profile");
          }
        })
        .catch((err) => {
          return res.redirect("/404");
        });
    } else if (!req.files.upload && req.files.frontfiles) {
      frontFile = req.files.frontfiles;
      newfrontfileName = Date.now() + frontFile.name;

      s3.uploadToS3(
        "Articles",
        frontFile,
        newfrontfileName.replace(" ", "_"),
        (error, data) => {
          if (data) {
            s3.deleteFileFromS3("Articles", Post.frontfile, (error, data) => {
              if (data) console.log({ mg: "front file updated." });
            });

            PostSchema.update(
              {
                title: req.body.title,
                content: req.body.content,
                price: req.body.price,
                version: req.body.payfor,
                category: req.body.category,
                frontfile: newfrontfileName.replace(" ", "_"),
                file: req.body.upload,
              },
              {
                where: {
                  id: id,
                },
              }
            )
              .then((data) => {
                if (!data) {
                  return res.redirect("/404");
                } else if (session.admin) {
                  return res.redirect("/admin");
                } else {
                  return res.redirect("/profile");
                }
              })
              .catch((err) => {
                return res.redirect("/404");
              });
          } else {
            return res.redirect(`/updatepost/${Post.id}`);
          }
        }
      );
    } else if (!req.files.frontfiles && req.files.upload) {
      uploadFile = req.files.upload;
      newuploadfileName = Date.now() + uploadFile.name;

      s3.uploadToS3(
        "Articles",
        uploadFile,
        newuploadfileName.replace(" ", "_"),
        (error, data) => {
          if (data) {
            s3.deleteFileFromS3("Articles", Post.file, (error, data) => {
              if (data) {
              }
            });
            PostSchema.update(
              {
                title: req.body.title,
                content: req.body.content,
                price: req.body.price,
                version: req.body.payfor,
                category: req.body.category,
                frontfile: req.body.frontfiles,
                file: newuploadfileName.replace(" ", "_"),
              },
              {
                where: {
                  id: id,
                },
              }
            )
              .then((data) => {
                if (!data) {
                  return res.redirect("/404");
                } else if (session.admin) {
                  return res.redirect("/admin");
                } else {
                  return res.redirect("/profile");
                }
              })
              .catch((err) => {
                return res.redirect("/404");
              });
          } else {
            return res.redirect(`/updatepost/${Post.id}`);
          }
        }
      );
    } else {
      frontFile = req.files.frontfiles;
      newfrontfileName = Date.now() + frontFile.name;
      uploadFile = req.files.upload;
      newuploadfileName = Date.now() + uploadFile.name;

      s3.uploadToS3(
        "Articles",
        frontFile,
        newfrontfileName.replace(" ", "_"),
        (error, data) => {
          if (data) {
            s3.uploadToS3(
              "Articles",
              uploadFile,
              newuploadfileName.replace(" ", "_"),
              (error, data) => {
                if (data) {
                  s3.deleteFileFromS3(
                    "Articles",
                    Post.frontfile,
                    (error, data) => {
                      if (data) console.log({ mg: "front file updated" });
                    }
                  );

                  s3.deleteFileFromS3("Articles", Post.file, (error, data) => {
                    if (data) console.log({ mg: "file updated" });
                  });

                  PostSchema.update(
                    {
                      title: req.body.title,
                      content: req.body.content,
                      price: req.body.price,
                      version: req.body.payfor,
                      category: req.body.category,
                      frontfile: newfrontfileName.replace(" ", "_"),
                      file: newuploadfileName.replace(" ", "_"),
                    },
                    { where: { id: id } }
                  )
                    .then((data) => {
                      if (!data) {
                        return res.redirect("/404");
                      } else if (session.admin) {
                        return res.redirect("/admin");
                      } else {
                        return res.redirect("/profile");
                      }
                    })
                    .catch((err) => {
                      return res.status(500).send({
                        err: err.message,
                      });
                    });
                } else {
                  return res.redirect(`/updatepost/${Post.id}`);
                }
              }
            );
          } else {
            return res.redirect(`/updatepost/${Post.id}`);
          }
        }
      );
    }
  } catch (error) {
    return res.redirect("/404");
  }
};

exports.DeletePost = async (req, res) => {
  const id = req.params.id;
  const session = req.session.user;
  if (session) {
    const UserLogin = await UserSchema.findByPk(session.id);
    const Username = UserLogin.username;
    const Admin = UserLogin.admin;
    PostSchema.findByPk(id)
      .then((data) => {
        if (!data) {
          return res.redirect("/404");
        } else if (data.author == Username || (Admin && data)) {
          s3.deleteFileFromS3("Articles", data.file, (error, good) => {
            if (good) console.log("Update success");
          });
          s3.deleteFileFromS3("Articles", data.frontfile, (error, good) => {
            if (good) console.log("Update success");
          });
          PostSchema.destroy({ where: { id: id } }).then((del) => {
            if (del && Admin) return res.redirect("/admin");
            else return res.redirect("/profile");
          });
        } else if (data.author !== Username) {
          return res.redirect("/404");
        }
      })
      .catch((err) => {
        return res.redirect("/404");
      });
  } else {
    return res.redirect("/404");
  }
};

exports.LoginId = async (req, res) => {
  const session = req.session.user;

  if (session) {
    const User = await UserSchema.findByPk(session.id);

    const PaymentPending = await PaySchema.findAll(
      { where: { user: session.username, acc: false } },
      { order: [["updatedAt", "DESC"]] }
    );
    const Post = await PostSchema.findAll(
      { where: { author: session.username, acc: true } },
      { order: [["updatedAt", "DESC"]] }
    );
    const PostUnknown = await PostSchema.findAll(
      { where: { author: session.username, acc: false } },
      { order: [["updatedAt", "DESC"]] }
    );
    const Withdraw = await WithdrawSchema.findAll(
      { where: { user: session.username, acc: false } },
      { order: [["updatedAt", "DESC"]] }
    );
    if (session.id == User.id)
      return res.render("profile/profilepage", {
        PaymentPending,
        Post,
        PostUnknown,
        User,
        Today,
        Withdraw,
      });
    else if (User.admin)
      return res.render("profile/profilepage", {
        PaymentPending,
        Post,
        PostUnknown,
        Userauth,
        Today,
        Withdraw,
      });
  } else {
    return res.redirect("/");
  }
};

exports.AdminPage = async (req, res) => {
  const session = req.session.user;
  const Post = await PostSchema.findAll(
    { where: { acc: false } },
    { order: [["updatedAt", "DESC"]] }
  );
  const PostHome = await PostSchema.findAll(
    { where: { acc: true } },
    { order: [["updatedAt", "DESC"]] }
  );
  const Payment = await PaySchema.findAll(
    { where: { acc: false } },
    { order: [["updatedAt", "DESC"]] }
  );
  const Withdraw = await WithdrawSchema.findAll(
    { where: { acc: false } },
    { order: [["updatedAt", "DESC"]] }
  );
  const User = await UserSchema.findAll({ order: [["updatedAt", "DESC"]] });

  if (session) {
    if (session.admin) {
      return res.render("admin/adminpage", {
        Payment,
        Post,
        PostHome,
        User,
        Today,
        adminname: session.username,
        Withdraw,
      });
    } else {
      return res.redirect("/");
    }
  } else {
    return res.redirect("/");
  }
};

exports.AcceptPost = async (req, res) => {
  const id = req.params.id;
  const Post = await PostSchema.findByPk(id);
  const Author = Post.author;
  const User = await UserSchema.findOne({ where: { username: Author } });
  const email = User.email;
  const subject = `Postingan Asah Journal:${Author}`;
  const html = `
      <div>
      <h1>Postinganmu Telah Terverifikasi!</h1>
      <p>Judul: ${Post.title}</p>
      <p>Mohon cek akun anda. Selamat menggunakan layanan kami.</p>
      </div>
      `;

  PostSchema.update({ acc: true }, { where: { id: id } })
    .then((data) => {
      if (!data) {
        return res.redirect("/404");
      } else {
        sendMail(email, subject, html), res.redirect("/admin");
      }
    })
    .catch((err) => {
      return res.redirect("/admin");
    });
};

exports.SearchItem = async (req, res) => {
  const session = req.session.user;
  try {
    let searchInput = req.body.request;
    let searchPost = await PostSchema.findAll({
      where: {
        [Op.or]: [
          { title: { [Op.like]: `%${searchInput}%` } },
          { author: { [Op.like]: `%${searchInput}%` } },
          { content: { [Op.like]: `%${searchInput}%` } },
          { updatedAt: { [Op.like]: `%${searchInput}%` } },
          { category: { [Op.like]: `%${searchInput}%` } },
          { version: { [Op.like]: `%${searchInput}%` } },
          { price: { [Op.like]: +searchInput } },
        ],
        acc: true,
      },
    });
    if (session) {
      const User = await UserSchema.findByPk(session.id);
      const Post = await PostSchema.findAll(
        {
          where: { author: session.username, acc: true },
        },
        { order: [["updatedAt", "DESC"]] }
      );
      return res.render("searchpage/searchpagein", {
        searchInput,
        searchPost,
        User,
        Post,
        admin: session.admin,
      });
    } else {
      return res.render("searchpage/searchpageout", { searchInput, searchPost });
    }
  } catch (error) {
    return res.redirect("/404");
  }
};

exports.VerifUser = async (req, res) => {
  try {
    const verifCode = req.params.verificationcode;
    const user = await UserSchema.findOne({
      where: { veriftoken: verifCode },
    });

    UserSchema.update({ verify: true, veriftoken: null }, { where: { id: user.id } }).then(
      (account) => {
        if (!account) {
          return res.redirect("/404");
        } else {
            return res.redirect("/");
        }
      }
    );
  } catch (error) {
    return res.redirect("/404");
  }
};

exports.UpdateUserForm = async (req, res) => {
  const id = req.params.id;
  const session = req.session.user;
  const User = await UserSchema.findByPk(id);
  if (session) {
    if (session.username == User.username || session.admin) {
      return res.render("profile/updateuserform", {
        User,
        Today,
        admin: session.admin,
      });
    } else {
      return res.redirect("/404");
    }
  } else {
    return res.redirect("/404");
  }
};

exports.UpdateUser = async (req, res) => {
  let id = req.params.id;
  let session = req.session.user;

  try {
    let uploadFile;
    let newFileName;

    if (!req.files || Object.keys(req.files).length === 0) {
      UserSchema.update(
        {
          image: req.body.profileimage,
          email: req.body.email,
          phone: req.body.phone,
          linkedin: req.body.linkedin,
        },
        { where: { id: id } }
      ).then((data) => {
        if (!data) {
          return res.redirect("/404");
        } else if (session.admin) {
          return res.redirect("/admin");
        } else {
          return res.redirect("/profile");
        }
      });
    } else {
      const User = await UserSchema.findByPk(id);
      uploadFile = req.files.profileimage;
      newFileName = Date.now() + uploadFile.name;

      s3.uploadToS3("Profiles", uploadFile, newFileName, (error, data) => {
        if (data) {
          s3.deleteFileFromS3("Profiles", User.image, (error, data) => {
            if (data) console.log({ mg: "profile file updated." });
          });

          UserSchema.update(
            {
              image: newFileName,
              email: req.body.email,
              phone: req.body.phone,
              linkedin: req.body.linkedin,
            },
            { where: { id: id } }
          ).then((data) => {
            if (!data) {
              return res.redirect("/404");
            } else if (session.admin) {
              return res.redirect("/admin");
            } else {
              return res.redirect("/profile");
            }
          });
        } else if (!data) {
          if (session.admin) {
            return res.redirect("/admin");
          } else {
            return res.redirect("/profile");
          }
        }
      });
    }
  } catch (error) {
    return res.redirect("/404");
  }
};

exports.SendResetPasswordPage = async (req, res) => {
  let subject = "Reset Password";
  let email = req.body.email2;
  let resettoken = await crypto.randomBytes(20).toString("hex")
  
  const UserValid = await UserSchema.findOne({where:{email:email}});

  UserSchema.update(
    { passwordtoken: resettoken},
    { where: { email: email } }
  ).then((data) => {
      if (data && UserValid) {
        const tokenid = data.passwordtoken
        let html = `<div style="display:flex;justify-content: center;"><h1>Asah Team</h1></div>
                <div>
                <h4>Reset password dengan membuka link berikut <a href="https://www.asahjournal.com/resetpassword/${resettoken}">link</a>,</h4>
                <p>atau gunakan link berikut sebagai alternatif:</p>
                <p>https://www.asahjournal.com/resetpassword/${resettoken}</p>
                <br>
                <h5 style="color:red;">Penting!!! Jangan bagikan link pada siapapun!</h5>
                </div>`;
        sendMail(email, subject, html),
          res.status(400).render("profile/loginprob", {
            dataprob: `Tolong periksa email ${email}`,
          });
      } else {
        return res.status(400).render("profile/loginprob", {
          dataprob: `Email ${email} tidak valid`,
        });
      }
    })
    .catch((error) => {
      return res.send({mg: error.message});
    });
};

exports.ResetPasswordPage = async (req, res) => {
  let resetpass = req.params.resetpass;
  const User = await UserSchema.findOne({where:{passwordtoken:resetpass}});
  return res.render("errorpage/passwordreset", {
    User,
    Today,
    dataprob: "Reset Password | Asah Journal",
  });
};

exports.ResetPassword = async (req, res) => {
  let resetpass = req.params.resetpass;
  let pass1 = req.body.pass1;
  let pass2 = req.body.pass2;
  const User = await UserSchema.findOne({
    where: { passwordtoken: resetpass },
  });

  if (pass1 == pass2) {
    bcrypt.genSalt(12, (err, salt) => {
      bcrypt.hash(pass1, salt, (err, hash) => {
        UserSchema.update(
          { password: hash, passwordtoken: null },
          { where: { passwordtoken: resetpass } }
        )
          .then((data) => {
            if (data) {
                return res.redirect("/login");
            } else {
              return res.redirect("/404");
            }
          })
          .catch((error) => {
            return res.redirect("/404");
          });
      });
    });
  } else {
    return res.status(400).render("errorpage/passwordreset", {
      User,
      Today,
      dataprob: "Password tidak sama!",
    });
  }
};

exports.UserDelete = async (req, res) =>{
    const id = req.params.id;
    const session = req.session.user;
    if (session.admin == true){
        UserSchema.destroy({where:{id:id}}).then(
              res.redirect("/admin")
            )
    } else {
        return res.redirect("/404")
    }
    
}
//MAIN PAGE

// PAYMENT SYSTEM

exports.PaymentPage = async (req, res) => {
  const session = req.session.user;

  if (session) {
    const User = await UserSchema.findByPk(session.id);
    return res.render("fund/paymentpage", {
      User,
      admin: session.admin,
      Today,
      dataprob: "Gunakan waktumu untuk berkarya!",
    });
  } else {
    return res.redirect("/login");
  }
};

exports.PaymentCommand = async (req, res) => {
  const user = req.session.user;
  if (user) {
    const UserPay = await UserSchema.findByPk(user.id);
    const Username = UserPay.username;

    try {
      let uploadFile;
      let newFileName;

      if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).render("fund/paymentpage", {
          UserPay,
          Today,
          dataprob: "Kamu belum memasukan bukti pembayaran!",
        });
      }

      uploadFile = req.files.upload;
      newFileName = Date.now() + uploadFile.name;

      s3.uploadToS3("Payments", uploadFile, newFileName, (error, data) => {
        if (data) {
          PaySchema.create({
            user: Username,
            price: req.body.price,
            image: newFileName,
          });
          return res.redirect("/profile");
        }
      });
    } catch (error) {
      return res.redirect("/404");
    }
  } else {
    return res.redirect("/");
  }
};

exports.PaymentUpdatePage = async (req, res) => {
  const user = req.session.user;
  const payId = req.params.id;
  if (user) {
    const Payment = await PaySchema.findByPk(payId);
    if (user.username == Payment.user) {
      return res.render("fund/updatepayment", { Today, Payment, dataprob: undefined });
    } else {
      return res.redirect("/404");
    }
  } else {
    return res.redirect("/login");
  }
};

exports.PaymentUpdate = async (req, res) => {
  const user = req.session.user;
  const payId = req.params.id;
  const Payment = await PaySchema.findByPk(payId);

  try {
    let uploadFile;
    let newFileName;

    if (!req.files || Object.keys(req.files).length === 0) {
      if (user.username == Payment.user) {
        PaySchema.update(
          { price: req.body.price },
          { where: { id: payId } }
        ).then((data) => {
          if (data) {
            return res.redirect("/profile");
          } else {
            return res.redirect("/404");
          }
        });
      } else {
        return res.redirect("/404");
      }
    } else {
      uploadFile = req.files.upload;
      newFileName = Date.now() + uploadFile.name;

      s3.uploadToS3("Payments", uploadFile, newFileName, (error, data) => {
        if (data) console.log({ mg: "payment file uploaded" });
      });

      s3.deleteFileFromS3("Payments", Payment.image, (error, data) => {
        if (data) console.log({ mg: "payment file updated." });
      });
      if (user.username == Payment.user) {
        PaySchema.update(
          {
            image: newFileName,
            price: req.body.price,
          },
          { where: { id: payId } }
        ).then((data) => {
          if (data) {
            return res.redirect("/profile");
          } else {
            return res.redirect("/404");
          }
        });
      } else {
        return res.redirect("/404");
      }
    }
  } catch (error) {
    return res.redirect("/404");
  }
};

exports.PaymentDelete = async (req, res) => {
  const id = req.params.id;
  const user = req.session.user;
  const Payment = await PaySchema.findByPk(id);
  if (user) {
    if (user.username == Payment.user || user.admin) {
      s3.deleteFileFromS3("Payments", Payment.image, (error, data) => {
        if (data) console.log({ mg: "payment file updated." });
      });
      PaySchema.destroy({ where: { id: id } }).then((data) => {
        if (data) {
          if (user.admin) {
            return res.redirect("/admin");
          } else {
            return res.redirect("/profile");
          }
        } else {
          return res.redirect("/404");
        }
      });
    } else {
      return res.redirect("/404");
    }
  }
};

exports.ViewPayment = async (req, res) => {
  const session = req.session.user;
  const payId = req.params.id;
  const Payment = await PaySchema.findByPk(payId);
  let payName = Payment.user;
  const User = await UserSchema.findOne({ where: { username: payName } });

  const requestpay = Payment.price;
  const wallet = User.wallet;
  const total = requestpay + wallet;

  if (session) {
    if (session.id == User.id || session.admin == User.admin)
      return res.render("admin/accpaymentpage", {
        User,
        Payment,
        requestpay,
        wallet,
        total,
        kode: Date.now(),
      });
  } else {
    return res.redirect("/");
  }
};

exports.AcceptPayment = async (req, res) => {
  const payId = req.params.id;
  const Payment = await PaySchema.findByPk(payId);
  let payName = Payment.user;
  const User = await UserSchema.findOne({ where: { username: payName } });

  const requestpay = Payment.price;
  const wallet = User.wallet;
  const total = requestpay + wallet;

  UserSchema.update({ wallet: total }, { where: { id: User.id } }).then(
    (data) => {
      if (data) {
        const email = User.email;
        const subject = `Deposit Asah Journal:${User.username}`;
        const html = `
      <h1>Pembayaranmu Sebesar Rp${requestpay} Berhasil!</h1>
      <p>Selamat menggunakan layanan kami.</p>
      `;
        PaySchema.destroy({ where: { id: payId } }).then(
          sendMail(email, subject, html),
          res.redirect("/admin")
        );
      } else {
        return res.redirect("/404");
      }
    }
  );
};

exports.BuyPost = async (req, res) => {
  const session = req.session.user;
  const postId = req.params.id;
  if (session) {
    const Buyer = await UserSchema.findByPk(session.id);
    const Post = await PostSchema.findByPk(postId);
    const authorName = Post.author;
    const Author = await UserSchema.findOne({
      where: { username: authorName },
    });

    const buyerWallet = Buyer.wallet;
    const authorWallet = Author.wallet;
    const postPrice = Post.price;

    const buyerWalletNew = buyerWallet - postPrice;
    const authorWalletNew = authorWallet + postPrice;

    if (buyerWallet < postPrice) {
      return res.redirect("/404");
    } else {
      UserSchema.update(
        { wallet: buyerWalletNew },
        { where: { id: session.id } }
      ).then((data) => {
        if (data) {
          UserSchema.update(
            { wallet: authorWalletNew },
            { where: { id: Author.id } }
          );
          return res.redirect(`/getfile/Articles/${Post.file}`);
        } else {
          return res.redirect("/");
        }
      });
    }
  } else {
    return res.redirect("/login");
  }
};

exports.WithdrawPage = async (req, res) => {
  const session = req.session.user;

  if (session) {
    const User = await UserSchema.findByPk(session.id);
    return res.render("fund/withdrawpage", {
      User,
      admin: session.admin,
      Today,
      dataprob: "Tarik Saldomu",
    });
  } else {
    return res.redirect("/login");
  }
};

exports.WithdrawCommand = async (req, res) => {
  const session = req.session.user;
  if (session) {
    const User = await UserSchema.findByPk(session.id);
    if (User.wallet < req.body.price) {
      return res.redirect("/404");
    } else {
      WithdrawSchema.create({
        user: User.username,
        price: req.body.price,
      });

      return res.redirect("/profile");
    }
  } else {
    return res.redirect("/login");
  }
};

exports.WithdrawAccept = async (req, res) => {
  const withdrawId = req.params.id;
  const Withdraw = await WithdrawSchema.findByPk(withdrawId);
  const withName = Withdraw.user;
  const User = await UserSchema.findOne({ where: { username: withName } });

  const withdrawRequest = Withdraw.price;
  const userWallet = User.wallet;
  const total = userWallet - withdrawRequest;

  const email = User.email;
  const subject = `Penarikan Saldo Asah Journal:${User.username}`;
  const html = `
      <h1>Penarikan Sebesar Rp${withdrawRequest} Berhasil!</h1>
      <p>Terima kasih!.</p>
      `;

  UserSchema.update({ wallet: total }, { where: { id: User.id } })
    .then((data) => {
      if (data) {
        WithdrawSchema.destroy({ where: { id: withdrawId } }).then(
          sendMail(email, subject, html),
          res.redirect("/admin")
        );
      } else {
        return res.redirect("/404");
      }
    })
    .catch((error) => {
      return res.redirect("/404");
    });
};

exports.WithdrawDelete = async (req, res) => {
  const id = req.params.id;
  const user = req.session.user;
  const Withdraw = await WithdrawSchema.findByPk(id);
  if (user) {
    if (user.username == Withdraw.user || user.admin) {
      WithdrawSchema.destroy({ where: { id: id } }).then((data) => {
        if (data) {
          if (user.admin) {
            return res.redirect("/admin");
          } else {
            return res.redirect("/profile");
          }
        } else {
          return res.redirect("/404");
        }
      });
    } else {
      return res.redirect("/404");
    }
  }
};

exports.Acceptwithdrawlink = async (req, res) => {
  let test = 1;
};

// PAYMENT SYSTEM

//SEND EMAIL TO USER
exports.SendEmailToUser = async (req, res) => {
  const email = req.body.email;
  const title = req.body.title;
  const message = req.body.message;
  const html = `<p>${message}</p>`;

  sendMail(email, title, html).then(res.redirect("/admin"));
};

//404 Page
exports.PageErr = (req, res) => {
  return res.render("errorpage/404");
};
