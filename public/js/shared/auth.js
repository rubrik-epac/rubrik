if (document.readyState == "loading") {
    document.addEventListener("DOMContentLoaded", authReady);
} else {
    authReady();
}

function authReady() {

    // Add placeholders to form inputs:
    // on register page -> to email(s) and password inputs
    // on login page -> to email and password inputs
    // on reset-password page -> to email input
    let authGroups = document.getElementsByClassName("auth-group");
    // authGroups.length - 1 to leave last authGroup out (button)
    for (let i = 0; i < authGroups.length - 1; i++) {
        let authInput = authGroups[i].children[1] // [0] label, [1] input
        authInput.addEventListener("focus", on_form_input_focus);
        authInput.addEventListener("focusout", on_form_input_focusOut);
    }

    // Focus first input
    authGroups[0].children[1].focus();

    // Update select options on evaluation change:
    // e.g. Continuous Eval. -> groups of 2-4 && Final Eval. -> groups of 2
    let evaluationType = document.getElementById("evaluation-type");
    // if register page (and validation is passed) -else (login, reset pwd page) undefined
    if (evaluationType != undefined) {
        evaluationType.addEventListener("change", on_eval_option_change);
    }

    // Check form input values for errors and send (register, login, reset-password) request to backend
    let authBtn = document.getElementsByClassName("auth-btn")[0];
    authBtn.id == "register" ? authBtn.addEventListener("click", handleRegister) :
    authBtn.id == "login" ? authBtn.addEventListener("click", handleLogin) :
    authBtn.id == "reset-pwd" ? authBtn.addEventListener("click", handlePasswordReset) :
    authBtn.addEventListener("click", handlePasswordUpdate)
}

function handleRegister() {

    // Check for errors
    let authGroups = document.getElementsByClassName("auth-group");
    let evaluationType = document.getElementById("evaluation-type");
    let selection = evaluationType.children[evaluationType.selectedIndex];
    let groupMin = selection.dataset.min;
    let foundError = false;
    let emails = [];
    let professorOption = document.getElementById("professor");
    let professor = professorOption[professorOption.selectedIndex].value;
    let challengeOption = document.getElementById("challenge");
    let challenge = challengeOption[challengeOption.selectedIndex].value;
    let evaluation = evaluationType[evaluationType.selectedIndex].value;
    let groupOption = document.getElementById("group");
    let group = groupOption[groupOption.selectedIndex].value;
    // authGroups.length - 2 to leave last 2 authGroups out (password and button)
    for (let i = 0; i < authGroups.length - 2; i++) {
        let authInput = authGroups[i].children[1] // [0] label, [1] input
        // check: @alumnos.upm.es for filled emails (filled optional emails as well)
        if (authInput.value != "") {
            let authInputSplit = authInput.value.split("@alumnos.upm.es");
            if (!authInput.value.includes("@alumnos.upm.es") || !authInputSplit.at(-1) == "" || authInputSplit.at(0).length == 0) {
                authInput.placeholder = "Please, use your @alumnos.upm.es email";
                authInput.value = "";
                authInput.classList.add("error");
                authInput.classList.remove("dirty");
                foundError = true;
            }
            else {
                emails.push(authInput.value);
            }
        }
        else {
            // check: !blank mandatory emails (at least groupMin emails)
            if (i < groupMin) {
                authInput.placeholder = "Please, enter your @alumnos.upm.es email"
                authInput.classList.add("error");
                foundError = true;
            }
            else {
                authInput.placeholder = "";
                authInput.classList.remove("error");
                authInput.classList.remove("dirty");
            }
        }
    }
    // check: correct password length
    let password = document.querySelectorAll("input[type=password]")[0];
    if (password.value.length < 4) {
        password.value = "";
        password.placeholder = "Please, enter at least 4 characters"
        password.classList.add("error");
        password.classList.remove("dirty");
        foundError = true;
    } else {
        if (password.value.length > 40) {
            password.value = "";
            password.placeholder = "Please, enter at most 40 characters"
            password.classList.add("error");
            password.classList.remove("dirty");
            foundError = true;
        }
    }
    // Send register request to backend
    if (!foundError) {
        axios({
        method: "post",
        url: "/register",
        data: {
            emails: emails,
            password: password.value,
            assessmentOption: evaluation,
            tutor: professor,
            group: group,
            challenge: challenge
        },
        headers: { "Content-Type": "application/json" },
      }).then(function(response) {
          // if error
          if (response.data.errors) {
              let emails = document.querySelectorAll("input[type=email]");
              if (response.data.errors.invalidEmails) {
                for (let email of emails) {
                    if (response.data.errors.invalidEmails[0].includes(email.value)) {
                        email.value = "";
                        email.placeholder = response.data.errors.invalidEmails[1];
                        email.classList.add("error");
                        email.classList.remove("dirty");
                    }
                }
              }
              else if (response.data.errors.emailsNotUnique) {
                  for (let email of emails) {
                      if (response.data.errors.emailsNotUnique[0].includes(email.value)) {
                        email.value = "";
                        email.placeholder = response.data.errors.emailsNotUnique[1];
                        email.classList.add("error");
                        email.classList.remove("dirty");
                      }
                  }
              }
              else if (response.data.errors.emailAlreadyInUseError) {
                  for (let email of emails) {
                      if (email.value == response.data.errors.emailAlreadyInUseError[0]) {
                        email.value = "";
                        email.placeholder = response.data.errors.emailAlreadyInUseError[1];
                        email.classList.add("error");
                        email.classList.remove("dirty");
                      }
                  }
              }
              else {
                // generalError
                for (let email of emails)  {
                    if (email.value != "") {
                        email.value = "";
                        email.placeholder = response.data.errors.generalError;
                        email.classList.add("error");
                        email.classList.remove("dirty");
                    }
                }
                let password = document.querySelectorAll("input[type=password]")[0];
                password.value = "";
                password.placeholder = response.data.errors.generalError;
                password.classList.add("error");
                password.classList.remove("dirty");
              }
          }
          // if success
          else {
              window.location.href = "/login";
          }
      }).catch (function(error) {
          // error. please try again
      })
    }
}

function handleLogin() {
    // Check for errors
    let email = document.querySelectorAll("input[type=email]")[0];
    let password = document.querySelectorAll("input[type=password]")[0];
    let foundError = false;
    // check: @alumnos.upm.es email
    let split = email.value.split("@alumnos.upm.es");
    if (!email.value.includes("@alumnos.upm.es") || !split.at(-1) == "" || split.at(0).length == 0) {
        email.placeholder = "Please, use your @alumnos.upm.es email";
        email.value = "";
        email.classList.add("error");
        email.classList.remove("dirty");
        foundError = true;
    }
    // check: correct password length
    if (password.value.length < 4) {
        password.value = "";
        password.placeholder = "Please, enter at least 4 characters"
        password.classList.add("error");
        password.classList.remove("dirty");
        foundError = true;
    } else {
        if (password.value.length > 40) {
            password.value = "";
            password.placeholder = "Please, enter at most 40 characters"
            password.classList.add("error");
            password.classList.remove("dirty");
            foundError = true;
        }
    }
    // Send login request to backend
    if (!foundError) {
        axios({
            method: "post",
            url: "/login",
            data: {
                email: email.value,
                password: password.value,
            },
            headers: { "Content-Type": "application/json" },
        })
        .then (function(response) {
            // if error
            if (response.data.errors) {
                if (response.data.errors.invalidEmail) {
                    email.value = "";
                    email.placeholder = response.data.errors.invalidEmail;
                    email.classList.add("error");
                    email.classList.remove("dirty");
                }
                else if (response.data.errors.invalidPasswordLength) {
                    password.value = "";
                    password.placeholder = response.data.errors.invalidPasswordLength;
                    password.classList.add("error");
                    password.classList.remove("dirty");
                }
                else if (response.data.errors.emailPassCombinationError) {
                    email.value = "";
                    email.placeholder = response.data.errors.emailPassCombinationError;
                    email.classList.add("error");
                    email.classList.remove("dirty");
                    password.value = "";
                    password.placeholder = response.data.errors.emailPassCombinationError;
                    password.classList.add("error");
                    password.classList.remove("dirty");
                }
                else {
                    // generalError
                    email.value = "";
                    email.placeholder = response.data.errors.generalError;
                    email.classList.add("error");
                    email.classList.remove("dirty");
                    password.value = "";
                    password.placeholder = response.data.errors.generalError;
                    password.classList.add("error");
                    password.classList.remove("dirty");
                }
            }
            // if success
            else {
                window.location.href = "/";
            }
        })
        .catch (function(error) {
            // error. please try again
        })
    }
}

function handlePasswordReset() {
    // Check for errors
    let email = document.querySelectorAll("input[type=email]")[0];
    let foundError = false;
    // check: @alumnos.upm.es email
    let split = email.value.split("@alumnos.upm.es");
    if (!email.value.includes("@alumnos.upm.es") || !split.at(-1) == "" || split.at(0).length == 0) {
        email.placeholder = "Please, use your @alumnos.upm.es email";
        email.value = "";
        email.classList.add("error");
        email.classList.remove("dirty");
        foundError = true;
    }
    // Send password reset request to backend
    if (!foundError) {
        axios({
            method: "post",
            url: "/reset-password",
            data: {
                email: email.value,
            },
            headers: { "Content-Type": "application/json" },
        })
        .then (function(response) {
            if (response.data.errors) {
                if (response.data.errors.invalidEmail) {
                    email.value = "";
                    email.placeholder = response.data.errors.invalidEmail;
                    email.classList.add("error");
                    email.classList.remove("dirty");
                }
                else if (response.data.errors.unknownEmail) {
                    email.value = "";
                    email.placeholder = response.data.errors.unknownEmail;
                    email.classList.add("error");
                    email.classList.remove("dirty");
                }
                else {
                    // generalError
                    email.value = "";
                    email.placeholder = response.data.errors.generalError;
                    email.classList.add("error");
                    email.classList.remove("dirty");
                }
            }
            else {
                window.location.href = "/";
            }
        })
        .catch (function (error) {
            // error. please try again
        })
    }
}

function handlePasswordUpdate() {
    // Check for errors
    let password = document.querySelectorAll("input[type=password]")[0];
    let foundError = false;
    // check: correct password length
    if (password.value.length < 4) {
        password.value = "";
        password.placeholder = "Please, enter at least 4 characters"
        password.classList.add("error");
        password.classList.remove("dirty");
        foundError = true;
    } else {
        if (password.value.length > 40) {
            password.value = "";
            password.placeholder = "Please, enter at most 40 characters"
            password.classList.add("error");
            password.classList.remove("dirty");
            foundError = true;
        }
    }
    if (!foundError) {
        axios({
            method: "post",
            url: window.location.href,
            data: {
                password: password.value,
            },
            headers: { "Content-Type": "application/json" },
        })
        .then (function(response) {
            // if error
            if (response.data.errors) {
                if (response.data.errors.invalidPasswordLength) {
                    password.value = "";
                    password.placeholder = response.data.errors.invalidPasswordLength;
                    password.classList.add("error");
                    password.classList.remove("dirty");
                    foundError = true;
                }
                else {
                    // generalError
                    password.value = "";
                    password.placeholder = response.data.errors.generalError;
                    password.classList.add("error");
                    password.classList.remove("dirty");
                    foundError = true;
                }
            }
            // if success
            else {
                window.location.href = "/login";
            }
        })
        .catch (function (err) {
            // error. please try again
        })
    }
}

function on_eval_option_change() {
    let selection = this.children[this.selectedIndex]; // this: select (with options inside)
    // Update professors, challenges, groups, and min and max group members to go with new eval. option
    let professors = selection.dataset["professors"].split(",");
    let challenges = selection.dataset["challenges"].split(",");
    let groups = selection.dataset["groups"].split(",");
    let groupMin = selection.dataset["min"];
    let groupMax = selection.dataset["max"];
    // Update professors
    let oldProfessor = document.getElementById("professor").value;
    let newProfessors = "";
    for (let professor of professors) {
        if (professor == oldProfessor) {
            newProfessors += "<option selected value='" + professor + "'>" + professor + "</option>";
        }
        else {
            newProfessors += "<option value='" + professor + "'>" + professor + "</option>";
        }
    }
    document.getElementById("professor").innerHTML = newProfessors;
    // Update challenges
    let oldChallenge = document.getElementById("challenge").value;
    let newChallenges = "";
    for (let challenge of challenges) {
        if (challenge == oldChallenge) {
            newChallenges += "<option selected value='" + challenge + "'>" + challenge + "</option>";
        }
        else {
            newChallenges += "<option value='" + challenge + "'>" + challenge + "</option>";
        }
    }
    document.getElementById("challenge").innerHTML = newChallenges;
    // Update groups
    let oldGroup = document.getElementById("group").value;
    let newGroups = "";
    for (let group of groups) {
        if (group == oldGroup) {
            newGroups += "<option selected value='" + group + "'>" + group + "</option>";
        }
        else {
            newGroups += "<option value='" + group + "'>" + group + "</option>";
        }
    }
    document.getElementById("group").innerHTML = newGroups;
    // Update disabled && optional email inputs
    document.querySelectorAll(".info").forEach(e => e.remove());
    let emails = document.querySelectorAll("input[type=email]");
    for (let i = 0; i < emails.length; i++) {
        if (i >= groupMax) {
            emails[i].placeholder = "";
            emails[i].value = "";
            emails[i].disabled = true;
            emails[i].classList.remove("error");
        }
        else {
            emails[i].disabled = false;
            if (i >= groupMin) {
                emails[i].previousElementSibling.innerHTML += '<span class="info">i<span class="tooltip">Optional</span></span>';
            }
        }
    }

}

function on_form_input_focus() {
    // Remove error
    this.classList.remove("error");
    // Update placeholder
    if (this.dataset.placeholder != undefined) {
        // password has no data-placeholder (undefined)
        // avoid 'undefined' as placeholder
        this.placeholder = this.dataset.placeholder;
    }
    else {
        this.placeholder = "";
    }
}

function on_form_input_focusOut() {
    // Update placeholder
    this.placeholder = "";
    // Update background
    if (this.value != "") {
        this.classList.add("dirty");
    }
    else {
        this.classList.remove("dirty");
    }
}