// development vs. production
if (process.env.NODE_ENV === "production") {
  console.log("Node Environment: Production.");
} else {
  console.log("Node Environment: Development.");
  require("dotenv").config();
}

// environment variables
const sessionSecret = process.env.SESSION_SECRET;
const mongoDBURI = process.env.MONGODB_URI;
const rubrikEmail = process.env.RUBRIK_EMAIL;
const emailPass = process.env.EMAIL_PWD;
const port = process.env.PORT || 3000;
let baseUrl;
if (process.env.NODE_ENV === "production") {
  baseUrl = process.env.BASE_URL;
} else {
  baseUrl = "http://localhost:" + port.toString();
}
let resetPwdHourWindow = process.env.RESET_PWD_HOUR_WINDOW;

// require
const express = require("express");
const mongoose = require("mongoose");
const helmet = require("helmet");
const bcrypt = require("bcryptjs");
const passport = require("passport");
const nodemailer = require("nodemailer");
const LocalStrategy = require("passport-local").Strategy;
const session = require("cookie-session");
const wordCount = require("wordcount");
const validator = require("email-validator");
const randomToken = require("random-token");
const moment = require("moment");
const fs = require("fs"); // does not require npm i fs

// app
const app = express();
// allow all Grammarly related requests
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'", "https://f-log-js-plugin.grammarly.io", "https://apps-public.grammarly.com", "https://tokens.grammarly.com", "https://gnar.grammarly.com", "wss://capi.grammarly.com"],
      scriptSrc: ["'self'", "https://cdn.jsdelivr.net", "https://js.grammarly.com"],
      imgSrc: ["'self'", "https://assets.grammarly.com"]
    }
  },
}));
// set COEP directive to "credentialless"
app.use(helmet.crossOriginEmbedderPolicy({ policy: "credentialless" }));
app.enable("trust proxy");
app.set("view engine", "ejs");
app.use(express.json());
app.use(express.static("public"));
app.use(
  session({
    secret: sessionSecret,
    resave: true  ,
    saveUninitialized: true,
  })
);
app.use(passport.initialize());
app.use(passport.session());

// database
mongoose.set("sanitizeFilter", true);
mongoose.connect(mongoDBURI).then(
  () => {
    console.log("MongoDB: Connected.");
  },
  (err) => {
    console.log("MongoDB: Connection error: " + err.message);
  }
);
const Schema = mongoose.Schema;
const userSchema = new Schema({
  // quizResults:
  // ids are used so that we can edit the subsections, questions & answers while still referring to the same entity (b/c getting statistics
  // of how students did on a question gets increasingly harder if several similar questions exist, but whose answers are to be grouped together).
  // providing an id makes it easier to reference a subsection/question/answer (e.g. id 0) even if the content is edited.
  // {
  //   pentachart: [
  //     {
  //       title: "Title & Subtitle",
  //       id: 0,
  //       whatToDo: "Read the section and decide which of the following requirements are not met (more than one option could be chosen).",
  //       results: [
  //         {
  //           whatToGradeId: 0,
  //           whatToGrade: "Control student attendance: Scan exams to control student attendance and recover them in case of loss.",
  //           choicesIds: [0, 1, 2],
  //           choices: [
  //             "The title/subtitle is interesting/catchy (uses words that create a positive impression and stimulate readers interest; is provocative, literary or imaginative; follows a phrase structure, not a full sentence structure, and contains mainly nouns).",
  //             "The title/subtitle is written in a formal tone (no contractions, no phrasal verbs, no abbreviations, no collocations or slang words, but impersonal and passive structures, objective language, technical terms, etc. are used).",
  //             "The title/subtitle clearly explains the essence of the proposal (predicts content, contains main keywords, captures main innovation, expands on the topic, does not contain redundant information)."
  //           ],
  //           attempts: [
  //             {
  //               chosenIds: [0, 1, 2],
  //               correctIds: [0, 2],
  //               date: "27/05/2022 13:07"
  //             },
  //             {
  //               // same structure (second attempt)
  //             }
  //           ]
  //         },
  //         {
  //           // same structure (for whatToGradeId: 1)
  //         }
  //       ]
  //     },
  //     {
  //       // same structure (for Background & Motivation)
  //     }
  //   ],
  //   research: [
  //     // same structure (for research)
  //   ]
  // }
  quizResults: Object,
  email: String,
  groupId: String,
  // selfAssessments, peerAssessments, etc. may be added here
}, { minimize: false });
const groupSchema = new Schema({
  password: String,
  validationToken: String,
  validationTokenDate: String,
  assessmentOption: String,
  assessmentOptionId: String,
  tutor: String,
  tutorId: String,
  group: String,
  groupId: String,
  challenge: String,
  challengeId: String,
});
const User = mongoose.model("user", userSchema); // use the singular version of the MongoDB collection name
const Group = mongoose.model("group", groupSchema); // e.g. "group" for "groups" (MongoDB Atlas) collection

// auth
passport.serializeUser((user, done) => {
  return done(null, user.id);
});
passport.deserializeUser((id, done) => {
  User.findById(id, (err, user) => {
    done(err, user);
  });
});
passport.use(
  new LocalStrategy({ usernameField: "email" }, (email, password, done) => {
    // 1. email in database?
    User.findOne({ email: email }).then((existingUser) => {
      if (!existingUser) {
        console.log(
          "Login error. User with email " + email + " not found in database."
        );
        return done(null, false);
      } else {
        console.log("Login. User " + existingUser);
        // 2. get password from database
        Group.findOne({ _id: existingUser.groupId}).then((existingGroup) => {
          if (!existingGroup) {
            console.log(
              "Login error. Group id " + existingUser.groupId + " not found in database."
            );
            return done(null, false);
          }
          else {
            // 3. password corrrect? compare hashed password w/ entered password using bcrypt
            let hashedPassword = existingGroup.password;
            console.log("Login. Group: " + existingGroup);
            bcrypt.compare(password, hashedPassword, (err, isSamePassword) => {
              if (err) {
                console.log("Login error. " + err.message);
                return done(null, false);
              } else {
                if (isSamePassword) {
                  console.log("Login success. User: " + existingUser + " Group: " + existingGroup);
                  return done(null, existingUser);
                } else {
                  console.log("Login error. Passwords do not match.");
                  return done(null, false);
                }
              }
            });
          }
        })
      }
    });
  })
);
function forwardAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    // forward
    res.redirect("/");
  } else {
    // do nothing
    return next();
  }
}

// register
app.get("/register", forwardAuthenticated, (req, res) => {
  let jsonData;
  try {
    jsonData = JSON.parse(fs.readFileSync('config-register.json', 'utf8'));
  }
  catch (err) {
    console.log("Error reading register data (from config-register.json) " + err);
    jsonData = {}
  }
  res.render("register.ejs",
    {
        registerParams: jsonData
    }
    );
});
app.post("/register", (req, res) => {
  let errors = {};
  try {
    // 1. get data from frontend (what the user entered on the website)
    const { emails, password, assessmentOption, tutor, group, challenge } = req.body;
    console.log(
      "\nNew register request:" +
        "\nEmails: " +
        emails +
        "\nPassword: " +
        password +
        "\nAssessment option: " +
        assessmentOption +
        "\nTutor: " +
        tutor +
        "\nGroup: " +
        group +
        "\nChallenge: " +
        challenge
    );
    // 2. get register restrictions (from backend file)
    let jsonData = JSON.parse(fs.readFileSync('config-register.json', 'utf8'));
    let validationsPassed = 0;
    let evaluationId;
    let professorId;
    let challengeId;
    let groupId;
    let minGroupMembers;
    let maxGroupMembers;
    // 3. check data from frontend meets restrictions
    // 3.1 assessment option, tutor, challenge, group exist?
    for (let i=0; i<jsonData["evaluation"].length; i++) {
      let evaluation = jsonData["evaluation"][i];
      let evaluationName = evaluation["name"];
      if (evaluationName == assessmentOption) {
        evaluationId = evaluation["nameId"].toString();
        validationsPassed += 1; // test 1
        for (let j=0; j<evaluation["professors"].length; j++) {
          let professor = evaluation["professors"][j];
          if (professor == tutor) {
            professorId = evaluation["professorsIds"][j].toString();
            validationsPassed += 1; // test 2
          }
        }
        for (let k=0; k<evaluation["challenges"].length; k++) {
          let challengeName = evaluation["challenges"][k];
          if (challengeName == challenge) {
            challengeId = evaluation["challengesIds"][k].toString();
            validationsPassed += 1; // test 3
          }
        }
        for (let l=0; l<evaluation["groups"].length; l++) {
          let groupName = evaluation["groups"][l];
          if (groupName == group) {
            groupId = evaluation["groupsIds"][l].toString();
            minGroupMembers = evaluation["group-members-min"].toString();
            maxGroupMembers = evaluation["group-members-max"].toString();
            validationsPassed += 1; // test 4
          }
        }
      }
    }
    // 3.2 correct number of emails?
    if (minGroupMembers <= emails.length <= maxGroupMembers) {
      validationsPassed += 1; // test 5
    }
    // 3.3 password from 4 to 40 characters? ===> this check is also present
    // on the frontend and should be done using a variable (just like 'group-members-max')
    // vs. hardcoded values.  I'm a bit short on time, so this works too :=)
    if (4 <= password.length <= 40) {
      validationsPassed += 1; // test 6
    }
    // if validation so far failed, send error (avoiding to retrieve
    // data from our database because the validation is going to fail anyways):
    if (validationsPassed != 6) {
      console.log("Register error. Validations 1-6 not passed.");
      res.send({ errors: { generalError: "Please, try again." } });
    }
    // if validation so far is passed (which should be the case, unless they modify the
    // frontend js), check for 'honest mistakes' (emails not unique, already exist, etc.)
    else {
      // 3.4 valid & '@alumnos.upm.es' emails?
      let invalidEmails = [];
      validationsPassed += 1; // test 7
      for (let email of emails) {
        if (!validator.validate(email) || !email.includes("@alumnos.upm.es")) {
          validationsPassed -= 1;
          invalidEmails.push(email);
        }
      }
      if (validationsPassed != 7) {
        console.log("Register error. Validation 7 not passed. Invalid email(s): " + invalidEmails);
        Object.assign(errors, {
          invalidEmails:  [invalidEmails, "Please, use a valid UPM email."],
        });
        res.send({ errors: errors });
      }
      else {
        // 3.5 unique emails?
        let set = new Set();
        let repeatedEmails = []
        for (let i = 0; i < emails.length; i++) {
            if(set.has(emails[i])) {
              repeatedEmails.push(emails[i]);
            }
            set.add(emails[i]);
        }
        if (set.size != emails.length) {
          console.log("Register error. Validation 8 not passed. Emails not unique.");
          Object.assign(errors, {
            emailsNotUnique:  [repeatedEmails, "Please, use unique emails to register."],
          });
          res.send({ errors: errors });
        }
        else {
          validationsPassed += 1; // test 8
          // 3.6 emails are not already present in our database?
          (async () => {
            validationsPassed += 1; // test 9
            for (let email of emails) { // 'for' does not await for async call to finish with 1st email,
              // to start with 2nd email, hence all emails may trigger an async db call and code 
              // would fail if more than one email already exists (multiple res.send -> Cannot set 
              // headers after they are sent to the client)
              if (validationsPassed == 9) {
                await User.findOne({ email: email }).then((user)=> {
                  // if user already exists, send error
                  if (user) {
                    validationsPassed -= 1;
                    console.log("Register error. Validation 8 not passed. User " + email + " already exists.");
                    Object.assign(errors, {
                      emailAlreadyInUseError: [email, email + " already exists."],
                    });
                    res.send({ errors: errors });
                  }
                });
              }
            }
          })().then(()=> {
            // if all validations are passed:
            // -> (test 1) assessment option is valid
            // -> (test 2) tutor is valid
            // -> (test 3) challenge is valid
            // -> (test 4) group is valid
            // -> (test 5) number of emails is within allowed range for assessment option
            // -> (test 6) emails are valid and contain '@alumnos.upm.es'
            // -> (test 7) password length is within allowed range
            // -> (test 8) emails are unique
            // -> (test 9) emails are not already registered
            if (validationsPassed == 9) {
              // 4. hash password
              bcrypt.genSalt(10, (err, salt) => {
                if (err) {
                  console.log("Register error. Salting error: " + err.message);
                  throw err;
                }
                else {
                  bcrypt.hash(password, salt, (err, hashedPassword) => {
                    if (err) {
                      console.log(
                        "Register error. Hashing error: " + err.message
                      );
                      throw err;
                    }
                    else {
                      // 5. save group to MongoDB
                      new Group({
                        password: hashedPassword,
                        validationToken: null,
                        validationTokenDate: null,
                        assessmentOption: assessmentOption,
                        assessmentOptionId: evaluationId,
                        tutor: tutor,
                        tutorId: professorId,
                        group: group,
                        groupId: groupId,
                        challenge: challenge,
                        challengeId: challengeId,
                      })
                        .save()
                        .then((group) => {
                          console.log(
                            "Register success. New group saved to database: " +
                              group
                          );
                          let groupId = group.id;
                          // 6. save users to MongoDB
                          for (let email of emails) {
                            new User({
                              quizResults: {
                                pentachart: [],
                                research: []
                              },
                              email: email,
                              groupId: groupId,
                            })
                              .save()
                              .then ((user) => {
                                console.log(
                                  "Register success. New user saved to database: " +
                                    user
                                );
                              })
                              .catch ((err) => {
                                console.log(
                                  "Register error. Error saving user to database: " + err.message
                                );
                                throw err;
                              })
                          }
                          // 7. everything has been saved to MongoDB. success
                          res.send({ success: {} });
                        })
                        .catch((err) => {
                          console.log(
                            "Register error. Error saving group to database: " + err.message
                          );
                          throw err;
                        });
                    }
                  });
                }
              });
            }
          })
        }
      }
    }
  }
  catch (err) {
    console.log("Register error. " + err.message);
    res.send({ errors: { generalError: "Please, try again." } });
  }
});

// login
app.get("/login", forwardAuthenticated, (req, res) => {
  res.render("login.ejs");
});
app.post("/login", (req, res, next) => {
  let errors = {};
  try {
    // 1. get data from frontend (what the user entered on the website)
    const { email, password } = req.body;
    console.log(
      "\nNew login request:" +
      "\nEmail: " +
      email +
      "\nPassword: " +
      password
    );
    // 2. check data from frontend is valid
    // 2.1 valid email?
    if (!validator.validate(email) || !email.includes("@alumnos.upm.es")) {
      console.log("Login error. Invalid email: " + email);
      Object.assign(errors, {
        invalidEmail:  "Please, use a valid UPM email.",
      });
      res.send({ errors: errors });
    }
    else {
      // 2.2 password from 4 to 40 characters? ===> this check is also present
      // on the frontend and should be done using a variable (just like 'group-members-max')
      // vs. hardcoded values.  I'm a bit short on time, so this works too :=)
      if (!(4 <= password.length <= 40)) {
        console.log("Login error. Invalid password length: " + password.length);
        Object.assign(errors, {
          invalidPasswordLength:  "Please, enter between 4 and 40 characters.",
        });
        res.send({ errors: errors });
      }
      else {
        // if all validations are passed up to this point:
        // 3. handle authentication attempt
        passport.authenticate("local", function (err, user, info) {
          if (err) {
            throw err;
          } else if (!user) {
            Object.assign(errors, {
              emailPassCombinationError: "Please, check your credentials.",
            });
            res.send({ errors: errors });
          } else {
            req.logIn(user, function (err) {
              if (err) {
                throw err;
              } else {
                res.send({ success: {} });
              }
            });
          }
        })(req, res, next);
      }
    }
  }
  catch (err) {
    console.log("Login request error. " + err.message);
    res.send({ errors: { generalError: "Please, try again." } });
  }
});
app.get("/plogin", (req, res) => {
  res.render("login.ejs", {
    admin: {}
  });
});

// logout
app.post("/logout", function(req, res){
  try {
    console.log("\nNew logout request.")
    req.session = null;
    req.sessionOptions.maxAge = 0;
    console.log("Logout success.")
  }
  catch (err) {
    console.log("Logout error: " + err.message);
  }
  res.send({});
});

// reset password (user sends request to change password)
app.get("/reset-password", forwardAuthenticated, (req, res) => {
  res.render("reset-password.ejs", {
    resetPwdHourWindow: resetPwdHourWindow
  });
});
app.post("/reset-password", function(req, res){
  let errors = {};
  try {
    // 1. get data from frontend (what the user entered on the website)
    const { email } = req.body;
    console.log(
      "\nNew password reset request:" + 
      "\nEmail: " +
      email
    );
    // 2. check data from frontend is valid
    // 2.1 valid email?
    if (!validator.validate(email) || !email.includes("@alumnos.upm.es")) {
      console.log("Reset password error. Invalid email: " + email);
      Object.assign(errors, {
        invalidEmail:  "Please, use a valid UPM email.",
      });
      res.send({ errors: errors });
    }
    else {
      // 2.2 email of existing user?
      User.findOne({ email: email })
      .then((existingUser) => {
        if (existingUser) {
          console.log(
            "Reset password. Email " + email + " belongs to an existing user."
          );
          // 3. get group of existing user
          Group.findOne({ _id: existingUser.groupId })
          .then((existingGroup) => {
            if (existingGroup) {
              // 4. create token to reset password
              let tokenLength = 32;
              let token = randomToken(tokenLength);
              // 5. save token and date (to allow resetPwdHourWindow -e.g 1h- to set password)
              existingGroup.validationToken = token;
              existingGroup.validationTokenDate = moment().format("DD/MM/YYYY HH:mm");
              existingGroup.save();
              // 6. send email (with token) to reset password
              let transporter = nodemailer.createTransport({
                host: "smtp.gmail.com",
                port: 465,
                secure: true,
                auth: {
                  user: rubrikEmail,
                  pass: emailPass,
                },
              });
              let mailOptions = {
                from: `"Rubrik" <${rubrikEmail}>`, // sender address (who sends)
                to: email, // receivers (who receives, e.g. "a@hotmail.es, b@gmail.com")
                subject: "Reset your password", // Subject line
                text: `A password reset event has been triggered. Visit the following link within the next ${resetPwdHourWindow} hours to change your password: ${ baseUrl + "/set-password/" + token }`, //  plaintext body
                html: `<div>
                        A password reset event has been triggered.
                        <br>
                        Visit the following link within the next ${resetPwdHourWindow} hours to change your password: 
                        <a href='${ baseUrl + "/set-password/" + token }'>${ baseUrl + "/set-password/" + token }</a>
                      </div>`, // html body
              };
              try {
                  transporter.sendMail(
                  mailOptions,
                  function (err, info) {
                    if (err) {
                      console.log("Reset password error. Nodemailer error: " + err.message);
                      Object.assign(errors, {
                        generalError:  "Please, try again.",
                      });
                      res.send({ errors: errors });
                    } else {
                      console.log(
                        "Reset password. Reset password email successfully sent:"
                      );
                      console.log(info);
                      res.send({ success: {} });
                    }
                  }
                );
              }
              catch (err) {
                console.log("Reset password error. Nodemailer error: " + err.message);
                Object.assign(errors, {
                  generalError:  "Please, try again.",
                });
                res.send({ errors: errors });
              }
            }
            else {
              console.log(
                "Reset password error. Group not found for email " + email
              );
              Object.assign(errors, {
                generalError:  "Please, try again.",
              });
              res.send({ errors: errors });
            }
          })
          .catch ((err) => {
            console.log("Reset password error: " + err.message);
            Object.assign(errors, {
              generalError:  "Please, try again.",
            });
            res.send({ errors: errors });
          }) 
        }
        else {
          console.log(
            "Reset password. Email " + email + " does not belong to any existing user."
          );
          Object.assign(errors, {
            unknownEmail:  "Please, use an existing UPM email.",
          });
          res.send({ errors: errors });
        }
      })
      .catch((err) => {
        console.log("Reset password error: " + err.message);
        Object.assign(errors, {
          generalError:  "Please, try again.",
        });
        res.send({ errors: errors });
      });
    }
  }
  catch (err) {
    console.log("Reset password error: " + err.message);
    Object.assign(errors, {
      generalError:  "Please, try again.",
    });
    res.send({ errors: errors });
  }
});
app.get("/preset-password", (req, res) => {
  res.render("reset-password.ejs", {
    admin: {},
    resetPwdHourWindow: resetPwdHourWindow
  });
});

// set password (user changes password within resetPwdHourWindow -e.g. 1h)
app.get("/set-password/:token", forwardAuthenticated, (req, res) => {
  try {
    // 1. search for token
    let validationToken = req.params.token;
    console.log(
      "\nNew set password (get) request:" + 
      "\nToken: " +
      validationToken
    );
    // 2. check token is valid (belongs to a group)
    Group.findOne({ validationToken: validationToken })
    .then((existingGroup) => {
      if (!existingGroup) {
        console.log(
          "Set password (get) error. Group not found for token: " + validationToken
        );
        res.redirect("/");
      }
      else {
        console.log(
          "Set password (get). Token belongs to group: " + existingGroup
        );
        res.render("set-password.ejs", {
          resetPwdHourWindow: resetPwdHourWindow,
        });
      }
    })
    .catch ((err) => {
      console.log(
        "Set password (get) error: " + err.message
      );
      res.redirect("/");
    })
  }
  catch (err) {
    console.log("Set password (get) error: " + err.message);
    res.redirect("/");
  }
});
app.post("/set-password/:token", (req, res) => {
  let errors = {};
  try {
    // 1. get data from frontend
    const { password } = req.body;
    let validationToken = req.params.token;
    console.log(
      "\nNew set password (post) request:" + 
      "\nToken: " +
      validationToken + 
      "\nNew password: " +
      password
    );
    // 2. password from 4 to 40 characters? ===> this check is also present
    // on the frontend and should be done using a variable (just like 'group-members-max')
    // vs. hardcoded values.  I'm a bit short on time, so this works too :=)
    if (4 <= password.length <= 40) {
      // 3. check token is valid (belongs to a group)
      Group.findOne({ validationToken: validationToken })
      .then((existingGroup) => {
        if (!existingGroup) {
          console.log(
            "Set password (post) error. Group not found for token: " + validationToken
          );
          Object.assign(errors, {
            generalError:  "Please, try again.",
          });
          res.send({ errors: errors });
        }
        else {
          console.log(
            "Set password (post). Token belongs to group: " + existingGroup
          );
          // 4. check token was created within resetPwdHourWindow
          let validationTokenDate = existingGroup.validationTokenDate;
          const currentDate = moment();
          const tokenDate = moment(
            validationTokenDate,
            "DD/MM/YYYY HH:mm"
          );
          const hourDiff = moment
            .duration(currentDate.diff(tokenDate))
            .asHours();
          console.log(
            "Set password (post). The token was created at: " +
              tokenDate.format("DD/MM/YYYY HH:mm") +
              " which is " +
              hourDiff +
              " hours away from now: " +
              currentDate.format("DD/MM/YYYY HH:mm")
          );
          if (hourDiff <= resetPwdHourWindow) {
            console.log("Set password (post). Request is made within allowed window.");
            // 5. hash password
            bcrypt.genSalt(10, (err, salt) => {
              if (err) {
                console.log("Set password (post) error. Salting error: " + err.message);
                Object.assign(errors, {
                  generalError:  "Please, try again.",
                });
                res.send({ errors: errors });
              }
              else {
                bcrypt.hash(password, salt, (err, hashedPassword) => {
                  if (err) {
                    console.log(
                      "Set password (post) error. Hashing error: " + err.message
                    );
                    Object.assign(errors, {
                      generalError:  "Please, try again.",
                    });
                    res.send({ errors: errors });
                  }
                  else {
                    // 6. save password to MongoDB
                    existingGroup.password = hashedPassword;
                    existingGroup.save();
                    res.send({ success: {} });
                  }
                });
              }
            });
          }
          else {
            console.log("Set password (post). Request was not made within allowed window.")
            Object.assign(errors, {
              generalError:  "Please, try again.",
            });
            res.send({ errors: errors });
          }
        }
      })
      .catch ((err) => {
        console.log(
          "Set password (post) error: " + err.message
        );
        Object.assign(errors, {
          generalError:  "Please, try again.",
        });
        res.send({ errors: errors });
      })
    }
    else {
      console.log("Set password (post) error. Invalid password length: " + password.length);
      Object.assign(errors, {
        invalidPasswordLength:  "Please, enter between 4 and 40 characters.",
      });
      res.send({ errors: errors });
    }
  }
  catch (err) {
    console.log("Set password (post) error: " + err.message);
    Object.assign(errors, {
      generalError:  "Please, try again.",
    });
    res.send({ errors: errors });
  }
});

// home
app.get("/", (req, res) => {
    let jsonData;
    try {
      jsonData = JSON.parse(fs.readFileSync('config-footer.json', 'utf8'));
    }
    catch (err) {
      console.log("Error reading footer data (from config-footer.json): " + err);
      jsonData = {}
    }
    res.render("index.ejs", {
      footerContactInfo: jsonData,
      user: req.user
    });
});

// activity
app.post("/submit-activity", (req, res) => {
  try {
     // 1. get data from frontend (what the user entered on the website)
     const { questionId, questionDescription, answersIds, answersDescriptions } = req.body;
     console.log(
      "\nNew sumbit activity request:" +
      "\nQuestion_id: " + 
      questionId + 
      "\nQuestion_Description: " + 
      questionDescription + 
      "\nAnswers_ids: " + 
      answersIds +
      "\nAnswers_Descriptions: " + 
      answersDescriptions
    );
    // 2. get correct answers and feedback
    let jsonData = JSON.parse(fs.readFileSync('config-answers.json', 'utf8'));
    let answersData = jsonData["whatToGradeIds"][questionId];
    let correctChoicesIds = answersData["correctChoicesIds"];
    let explanations = answersData["explanations"]
    // 3. assign a result (correct/incorrect) to every given answer
    let results = {}
    for (let id of Object.keys(explanations)) {
      // if chosen
      if (answersIds.includes(id)) {
        // if correct
        if (correctChoicesIds.includes(parseInt(id))) {
          results[id] = "1"; // good choice
        }
        // if incorrect
        else {
          results[id] = "-1"; // bad choice
        }
      }
      // if not chosen
      else {
        // if correct
        if (correctChoicesIds.includes(parseInt(id))) {
          results[id] = "-1"; // bad choice
        }
        // if incorrect
        else {
          results[id] = "1"; // good choice
        }
      }
    }
    console.log("Submit activity results (answer_id, correct/incorrect): ");
    console.log(results);
    res.send({ success: {
      results: results,
      explanations: explanations
    } });
    // 4. if user is logged in, save attempt
    try {
      if (req.user) {
        console.log("Submit activity: User " + req.user + " is logged in.");
        User.findOne({ email: req.user.email }).then ((existingUser) => {
          if (!existingUser) {
            console.log("Submit activity error. User not found in database.");
          }
          else {
            console.log("Submit activity. User found in database.");
            let configTool = JSON.parse(fs.readFileSync('config-tool.json', 'utf8'));
            let questionIssueTitle;
            let questionIssueTitleId;
            let questionWhatToDo;
            let questionDes;
            let questionChoicesIds;
            let questionChoices;
            let questionDocument;
            for (let document of Object.keys(configTool)) {
              if (document != "presentation") {
                let sections = configTool[document]["rubric"];
                for (let section of sections) {
                  let issues = section["issues"];
                  for (let issue of issues) {
                    if (issue.quizzes.whatToGradeIds.includes(parseInt(questionId))) {
                      questionIssueTitle = issue.title;
                      questionIssueTitleId = issue.id;
                      questionWhatToDo = issue.quizzes.whatToDo;
                      questionDes = issue.quizzes.whatToGrade[issue.quizzes.whatToGradeIds.indexOf(parseInt(questionId))];
                      questionChoicesIds = issue.quizzes.choicesIds;
                      questionChoices = issue.quizzes.choices;
                      questionDocument = document;
                    }
                  }
                }
              }
            }

            let documentData = existingUser.quizResults[questionDocument];
            if (documentData.length == 0) {
              existingUser.quizResults[questionDocument] = [{
                "title": questionIssueTitle,
                "id": questionIssueTitleId,
                "whatToDo": questionWhatToDo,
                "results": [
                  {
                    "whatToGradeId": parseInt(questionId),
                    "whatToGrade": questionDes,
                    "choicesIds": questionChoicesIds,
                    "choices": questionChoices,
                    "attempts": [
                      {
                        "chosenIds": answersIds,
                        "correctIds": correctChoicesIds,
                        "date": moment().format("DD/MM/YYYY HH:mm")
                      }
                    ]
                  }
                ]
              }];
              existingUser.markModified("quizResults");
              existingUser.save();
            }
            else {
              let documentSections = existingUser.quizResults[questionDocument];
              let existingDocumentSection;
              let issueFound = false;
              let sectionIdx;
              for (sectionIdx=0; sectionIdx<documentSections.length; sectionIdx++) {
                let documentSection = documentSections[sectionIdx];
                if (documentSection.id == questionIssueTitleId) {
                  existingDocumentSection = documentSection;
                  issueFound = true;
                  break;
                }
              }
              if (!issueFound) {
                existingUser.quizResults[questionDocument].push(
                  {
                    "title": questionIssueTitle,
                    "id": questionIssueTitleId,
                    "whatToDo": questionWhatToDo,
                    "results": [
                      {
                        "whatToGradeId": parseInt(questionId),
                        "whatToGrade": questionDes,
                        "choicesIds": questionChoicesIds,
                        "choices": questionChoices,
                        "attempts": [
                          {
                            "chosenIds": answersIds,
                            "correctIds": correctChoicesIds,
                            "date": moment().format("DD/MM/YYYY HH:mm")
                          }
                        ]
                      }
                    ]
                  }
                );
                existingUser.markModified("quizResults");
                existingUser.save();
              }
              else {
                let foundQuestion = false;
                let questionIdx;
                for (questionIdx=0; questionIdx<existingDocumentSection.results.length; questionIdx++) {
                  let userResult = existingDocumentSection.results[questionIdx];
                  if (questionId == userResult.whatToGradeId) {
                    foundQuestion = true;
                    break;
                  }
                }
                if (!foundQuestion) {
                  existingUser.quizResults[questionDocument][sectionIdx].results.push(
                    {
                      "whatToGradeId": parseInt(questionId),
                      "whatToGrade": questionDes,
                      "choicesIds": questionChoicesIds,
                      "choices": questionChoices,
                      "attempts": [
                        {
                          "chosenIds": answersIds,
                          "correctIds": correctChoicesIds,
                          "date": moment().format("DD/MM/YYYY HH:mm")
                        }
                      ]
                    }
                  );
                  existingUser.markModified("quizResults");
                  existingUser.save();
                }
                else {
                  existingUser.quizResults[questionDocument][sectionIdx].results[questionIdx].attempts.push(
                    {
                      "chosenIds": answersIds,
                      "correctIds": correctChoicesIds,
                      "date": moment().format("DD/MM/YYYY HH:mm")
                    }
                  );
                  existingUser.markModified("quizResults");
                  existingUser.save();
                }
              }
            }
          }
        })
        .catch ((err) => {
          console.log("Submit activity error: " + err.message);
        })
      }
      else {
        console.log("Submit activity: User is not logged in.");
      }
    }
    catch (err) {
      // make sure not to res.send (again)
      console.log("Submit activity error: " + err.message);
    }
  }
  catch (err) {
    console.log("Submit activity error: " + err.message);
    res.send({ errors: { generalError: "Please, try again." } });
  }
});

// quality check
app.post("/analyze-text", (req, res) => {
  let errors = {};
   try {
    // 1. get data from frontend (what the user entered on the website)
    let { textBoxContent } = req.body;
    console.log(
      "\nNew text analysis request:\n" +
      textBoxContent
    );
    // 2. check textBoxContent is not empty
    if (textBoxContent.length == 0) {
      console.log("Analyze text error. Text length is 0.")
      Object.assign(errors, {
        textLengthZero:  "Please, enter your text.",
      });
      res.send({ errors: errors });
    }
    else {
      // 3. replace ’ with ' (some phones use ’ while contractions.json uses ')
      textBoxContent = textBoxContent.replace(/’/g, "'");
      // 4. analyze textBoxContent
      // https://www.w3schools.com/jsref/jsref_obj_regexp.asp
      let count = wordCount(textBoxContent);
      
      // In-text citations
      let citationPattern1 = /\((?:[A-Za-z]+\s*,\s*\d+\))/ig; // APA
      let citationPattern2 = /(?:[A-Za-z]+\s*\(\d+\))/ig; // APA
      let citationPattern3 = /(?:In\s+\d+,\s*[A-Za-z]+)/ig; // APA
      let citationPattern4 = /\[\d+\]/ig; // IEEE
      let citationsPatterns = new Array(citationPattern1, citationPattern2, citationPattern3, citationPattern4);
      let citationMatches = new Array();
      for (let citationPattern of citationsPatterns) {
        let matches = textBoxContent.match(citationPattern);
        if (matches != null) {
          matches.forEach(match => citationMatches.push(match));
        }
      }

      // Good readability - sentences
      let longSentences = new Array();
      let shortSentences = new Array();
      let improperSentencesCount = 0;
      let sentences = textBoxContent.split('. ');
      for (let sentence of sentences) {
        let words = sentence.split(' ');
        let wordCount = words.length;
        if (wordCount > 35) {
          longSentences.push(sentence);
        }
        if (wordCount < 20){
          shortSentences.push(sentence);
        }
        improperSentencesCount = longSentences.length + shortSentences.length;
      }
      
      // Good readability - paragraphs
      let longParagraphs = new Array();
      let shortParagraphs = new Array();
      let improperParagraphsCount = 0;
      let paragraphs = textBoxContent.split('\n\n');
      for (let paragraph of paragraphs) {
        let sentenceCount = sentences.length;
        if (sentenceCount > 6) {
          longParagraphs.push(paragraph);
        }
        if (sentenceCount < 3) {
          shortParagraphs.push(paragraph);
        }
        improperParagraphsCount = longParagraphs.length + shortParagraphs.length;
      }

      // Personal style
      let pronounMatches = new Array();
      let jsonData1 = JSON.parse(fs.readFileSync('personal-pronouns.json', 'utf8'));
      for (let pronoun of Object.keys(jsonData1)) {
        let pattern = new RegExp("\\b" + pronoun + "\\b", "gi");
        let matches = textBoxContent.match(pattern);
        if (matches != null) {
          matches.forEach(match => pronounMatches.push(match));
        }
      }

      // Colloquialisms
      let colloquialismMatches = new Array();
      let jsonData2 = JSON.parse(fs.readFileSync('colloquialisms.json', 'utf8'));
      for (let slang of Object.keys(jsonData2)) {
        let pattern = new RegExp("\\b" + slang + "\\b", "gi");
        let matches = textBoxContent.match(pattern);
        if (matches != null) {
          matches.forEach(match => colloquialismMatches.push(match));
        }
      }
      
      // https://en.wikipedia.org/wiki/Wikipedia:List_of_English_contractions
      // Contractions
      let contractionMatches = new Array();
      let jsonData3 = JSON.parse(fs.readFileSync('contractions.json', 'utf8'));
      for (let contraction of Object.keys(jsonData3)) {
        let pattern = new RegExp("\\b" + contraction + "\\b", "gi");
        let matches = textBoxContent.match(pattern);
        if (matches != null) {
          matches.forEach(match => contractionMatches.push(match));
        }
      }

      // Phrasal verbs
      let phrasalVerbMatches = new Array();
      let jsonData4 = JSON.parse(fs.readFileSync('phrasal-verbs.json', 'utf8'));
      for (let phrasalVerb of Object.keys(jsonData4)) {
        let pattern = new RegExp("\\b" + phrasalVerb + "\\b", "gi");
        let matches = textBoxContent.match(pattern);
        if (matches != null) {
          matches.forEach(match => phrasalVerbMatches.push(match));
        }
      }

      // Informal connectors
      let informalConnectorMatches = new Array();
      let jsonData5= JSON.parse(fs.readFileSync('informal-connectors.json', 'utf8'));
      for (let informalConnector of Object.keys(jsonData5)) {
        let pattern = new RegExp("\\b" + informalConnector + "\\b", "gi");
        let matches = textBoxContent.match(pattern);
        if (matches != null) {
          matches.forEach(match => informalConnectorMatches.push(match));
        }
      }

      // https://academicmarker.com/academic-guidance/vocabulary/tentative-language/what-are-the-different-types-of-tentative-language/
      // Tentative language
      let tentativeMatches = new Array();
      let jsonData6 = JSON.parse(fs.readFileSync('tentative.json', 'utf8'));
      for (let tentative of Object.keys(jsonData6)) {
        let pattern = new RegExp("\\b" + tentative + "\\b", "gi");
        let matches = textBoxContent.match(pattern);
        if (matches != null) {
          matches.forEach(match => tentativeMatches.push(match));
        }
      }

      // Print final analysis on console
      let analysisFinalResult = {
          wordCount: count,
          pronounMatches: pronounMatches,
          colloquialismMatches: colloquialismMatches,
          phrasalVerbMatches: phrasalVerbMatches,
          informalConnectorMatches: informalConnectorMatches,
          contractionMatches: contractionMatches,
          shortSentences: shortSentences,
          longSentences: longSentences,
          improperSentencesCount: improperSentencesCount,
          shortParagraphs: shortParagraphs,
          longParagraphs: longParagraphs,
          improperParagraphsCount: improperParagraphsCount,
          tentativeMatches: tentativeMatches,
          citationMatches: citationMatches
      }
      console.log("Analyze text. Result:");
      console.log(analysisFinalResult);
      res.send({ success: analysisFinalResult });
    }
   }
   catch (err) {
     console.log("Analyze text error: " + err.message);
     res.send({ errors: { generalError: "Please, try again." } });
   }
});

// tool data (rubrics, activities, etc.)
app.get("/tool", (req, res) => {
  try {
    let jsonData = JSON.parse(fs.readFileSync('config-tool.json', 'utf8'));
    res.send(jsonData);
  }
  catch (err) {
    console.log("Error reading tool data (from config.tool.json): " + err);
    res.send({});
  }
});

// listen
app.listen(port);
