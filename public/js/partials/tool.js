if (document.readyState == "loading") {
    /* If content not loaded, call function when finished loading */
    document.addEventListener("DOMContentLoaded", toolReady);
} else {
     /* If content loaded, call function */
     toolReady();
}

var activeToggleOption = "pentachart"; /* pentachart, research, presentation */
var activeToolHeaderOption = "rubric"; /* rubric, selfAssessment, peerAssessment */
var toolContent; /* to populate with toolData */
var toolData; /* to populate toolContent */

/* Suggestion: make these 3 variables values of an object with activeToggleOption as key  */
var activeSideMenuPentachartIdx = 0; /* title & subtitle [0], background & motivation [1], etc. */
var activeSideMenuResearchIdx = 0; /* background & motivation [0], innovation & description [1], etc. */
var activeSideMenuPresentationIdx = 0; /* content [0], organization [1], visual aids [2], etc. */

var pentachartPeerData = []; /* peer assessment (pentachart) data entered by the user */
var researchPeerData = []; /* peer assessment (research) data entered by the user */
var presentationPeerData = []; /* peer assessment (presentation) data entered by the user */

var pentachartScore = -1; /* peer assessment pentachart accumulated score */
var researchScore = -1; /* peer assessment research accumulated score */
var presentationScore = -1; /* peer assessment presentation accumulated score */

var pentachartRubricData = []; /* rubric (pentachart) data entered by the user */
var researchRubricData = []; /* rubric (research) data entered by the user */
var presentationRubricData = []; /* rubric (presentation) data entered by the user */

var pentachartSelfText = "";
var researchSelfText = "";
var presentationSelfText = "";

var pentachartSelfTextAnalysis;
var researchSelfTextAnalysis;
var presentationSelfTextAnalysis;

function toolReady() {
    toolContent = document.getElementById("tool-content");
    let toggleOptions = document.getElementsByClassName("toggle-option"); /* pentachart, research, presentation */
    let toolHeaderOptions = document.getElementsByClassName("tool-header-option"); /* rubric, self assessment, peer assessment */
    for (let toggleOption of toggleOptions) {
        toggleOption.addEventListener("click", onToggleUpdate);
    }
    for (let toolHeaderOption of toolHeaderOptions) {
        toolHeaderOption.addEventListener("click", onToolHeaderUpdate);
    }
    window.addEventListener("resize", onWindowResize);
    axios({
        method: "get",
        url: "/tool",
        headers: { "Content-Type": "application/json" },
      }).then((response) => {
          toolData = response.data;
          for (let section of toolData["pentachart"]["rubric"]) {
              for (let issue of section.issues) {
                pentachartPeerData.push(
                    {
                        description: issue.description,
                        scoreIdx: -1,
                        justification: ""
                    }
                );
                pentachartRubricData.push(
                    {
                        questionIdx: -1,
                        whatToDo: issue.quizzes.whatToDo,
                        whatToGradeType: issue.quizzes.whatToGradeType,
                        whatToGrade: issue.quizzes.whatToGrade,
                        whatToGradeIds: issue.quizzes.whatToGradeIds,
                        choices: issue.quizzes.choices,
                        choicesIds: issue.quizzes.choicesIds
                    }
                );
              }
          }
          for (let section of toolData["research"]["rubric"]) {
            for (let issue of section.issues) {
                researchPeerData.push(
                    {
                        description: issue.description,
                        scoreIdx: -1,
                        justification: ""
                    }
                );
                researchRubricData.push(
                    {
                        questionIdx: -1,
                        whatToDo: issue.quizzes.whatToDo,
                        whatToGradeType: issue.quizzes.whatToGradeType,
                        whatToGrade: issue.quizzes.whatToGrade,
                        whatToGradeIds: issue.quizzes.whatToGradeIds,
                        choices: issue.quizzes.choices,
                        choicesIds: issue.quizzes.choicesIds
                    }
                );
            }
          }
          for (let section of toolData["presentation"]["rubric"]) {
            for (let issue of section.issues) {
                presentationPeerData.push(
                    {
                        description: issue.description,
                        scoreIdx: -1,
                        justification: ""
                    }
                );
            }
          }
          generateLeftSideMenu();
          generateRubricItem();
      }).catch((err) => {
          // tool-height (so it's not squeezed!) & generate message to please reload
      });
}

/* Make menu's visible height equal to content's visible height (up to 500px, then both scroll).
   Menu scrolls if menu's height > content's visible height.
   Make tool-content-container's height at least 500px for the initial rubrics (if initially
   // than that value), and remove the constraint for the questions and answers */
function onWindowResize() {
    let challengePlusAnswers = document.getElementsByClassName("challenge-plus-answers");
    let toolContentContainer = document.getElementsByClassName("tool-content-container")[0];
    if (challengePlusAnswers.length != 0) {
        if (window.innerWidth <= 1150) {
            if (window.innerWidth <= 750) {
                challengePlusAnswers[0].classList.add("challenge-plus-answers-col-750");
                challengePlusAnswers[0].classList.remove("challenge-plus-answers-col-1150");
            }
            else {
                challengePlusAnswers[0].classList.add("challenge-plus-answers-col-1150");
                challengePlusAnswers[0].classList.remove("challenge-plus-answers-col-750");
            }
        }
        else {
            challengePlusAnswers[0].classList.remove("challenge-plus-answers-col-750");
            challengePlusAnswers[0].classList.remove("challenge-plus-answers-col-1150");
        }
        // challengePlusAnswers.length != 0 -> we are on the inside of a challenge (not index 0)
        // we remove height constraint, to start content from the bottom (to align previous/next
        // buttons for easier navigation)-
        toolContentContainer.style.height = "";
    }
    else {
        // for index 0 (rubric description), we bring content up (if needed, which is when the
        // height is less than 500)
        if (toolContentContainer.offsetHeight < 500) {
            toolContentContainer.style.height = "500px";
        }
        else {
            toolContentContainer.style.height = "";
        }
    }
    let toolCont = document.getElementsByClassName("tool-content")[0];
    let h = toolCont.offsetHeight;
    console.log(h);
    document.getElementsByClassName("tool-menu")[0].style.height = "500px";
    document.getElementsByClassName("tool-menu")[0].style.maxHeight = "500px";
    
}

/* Sections & Contents (40%)
        Background & Motivation
        Innovation & Description
        (...)
    (...)
 */
function generateLeftSideMenu() {
    let sideMenu = ``;
    let sections = toolData[activeToggleOption]["rubric"];
    for (let section of sections) {
        let category = section.category.replace("&", "<span>&</span>"); // smaller font-size for &
        sideMenu += `<div class="rubric-title">` +
                        category +
                        ` <span class="grade-pct">` + section.gradePct + `%</span>` + 
                    `</div>`;
        for (let subSection of section.issues) {
            let title = subSection.title.replace("&", "<span>&</span>"); // smaller font-size for &
            sideMenu += `<div class="rubric-subtitle">` +
                            `<img src="images/svg/` + subSection.iconName + `.svg" loading=“lazy” decoding=“async” alt="` + subSection.iconName + `Icon">` +
                            title +
                        `</div>`;
        }
    }
    document.getElementsByClassName("tool-menu")[0].innerHTML = sideMenu;
    let subtitles = document.getElementsByClassName("rubric-subtitle");
    if (activeToggleOption == "pentachart") {
        subtitles[activeSideMenuPentachartIdx].classList.add("rubric-subtitle-active");
    }
    else if (activeToggleOption == "research") {
        subtitles[activeSideMenuResearchIdx].classList.add("rubric-subtitle-active");
    }
    else {
        subtitles[activeSideMenuPresentationIdx].classList.add("rubric-subtitle-active");
    }
    for (let subtitle of subtitles) {
        subtitle.addEventListener("click", changeActiveSubtitle);
    }
    onWindowResize();
}

/* */
function generateRubricItem() {
    let items;
    let questionIdx = -1;
    let whatToDo;
    let whatToGradeType;
    let whatToGrade;
    let whatToGradeIds;
    let choices;
    let choicesIds;
    let activeMenuIdx;
    let subtitles_count;
    if (activeToggleOption == "pentachart") {
        items = pentachartPeerData[activeSideMenuPentachartIdx].description;
        questionIdx = pentachartRubricData[activeSideMenuPentachartIdx].questionIdx;
        whatToDo = pentachartRubricData[activeSideMenuPentachartIdx].whatToDo;
        whatToGradeType = pentachartRubricData[activeSideMenuPentachartIdx].whatToGradeType;
        whatToGrade = pentachartRubricData[activeSideMenuPentachartIdx].whatToGrade;
        whatToGradeIds = pentachartRubricData[activeSideMenuPentachartIdx].whatToGradeIds;
        choices = pentachartRubricData[activeSideMenuPentachartIdx].choices;
        choicesIds = pentachartRubricData[activeSideMenuPentachartIdx].choicesIds;
        activeMenuIdx = activeSideMenuPentachartIdx;
        subtitles_count = pentachartPeerData.length;
    }
    else if (activeToggleOption == "research") {
        items = researchPeerData[activeSideMenuResearchIdx].description;
        questionIdx = researchRubricData[activeSideMenuResearchIdx].questionIdx;
        whatToDo = researchRubricData[activeSideMenuResearchIdx].whatToDo;
        whatToGradeType = researchRubricData[activeSideMenuResearchIdx].whatToGradeType;
        whatToGrade = researchRubricData[activeSideMenuResearchIdx].whatToGrade;
        whatToGradeIds = researchRubricData[activeSideMenuResearchIdx].whatToGradeIds;
        choices = researchRubricData[activeSideMenuResearchIdx].choices;
        choicesIds = researchRubricData[activeSideMenuResearchIdx].choicesIds;
        activeMenuIdx = activeSideMenuResearchIdx;
        subtitles_count = researchPeerData.length;
    }
    else {
        items = presentationPeerData[activeSideMenuPresentationIdx].description;
        activeMenuIdx = activeSideMenuPresentationIdx;
        subtitles_count = presentationPeerData.length;
    }
    let rubricItemTexts =   ``;
    if (questionIdx == -1) {
        // display rubric
        for (let item of items) {
            rubricItemTexts +=  `<div class="rubric-item-text">
                                    <span>
                                        <img src="images/svg/ShieldDone.svg" loading=“lazy” decoding=“async” alt="Shield">
                                    </span>
                                    <div>`+ item + `</div>
                                </div>`;
        }
        if (activeToggleOption != "presentation") {
            // include challenge cta in rubric (presentation has no challenges currently)
            let whatToGradeCount = whatToGrade.length;
            let challengeOrChallenges = whatToGradeCount == 1 ? ` challenge ` : ` challenges `;
            rubricItemTexts +=  `<div class="rubric-item-text check-understanding">
                                    <span>
                                        <img src="images/svg/Fire2.svg" loading=“lazy” decoding=“async” alt="Fire">
                                    </span>
                                    <div>
                                        Ready to check your understanding?<br>Complete ` +  whatToGradeCount + 
                                        challengeOrChallenges + `to give your grade a boost!
                                    </div>
                                </div>`;
        }
    }
    else {
        // display question
        let questionIdx;
        if (activeToggleOption == "pentachart") {
            questionIdx = pentachartRubricData[activeSideMenuPentachartIdx].questionIdx;
        }
        else {
            questionIdx = researchRubricData[activeSideMenuResearchIdx].questionIdx;
        }
        rubricItemTexts += `<div class="rubric-item-text">
                                <span>
                                    <img src="images/svg/TooltipSquare.svg" loading=“lazy” decoding=“async” alt="Question">
                                </span>
                                <div>` +
                                    whatToDo + 
                                `</div>
                            </div>`;
        let answersItems = `<div>`;
        let idx;
        let shuffledChoices = [];
        let shuffledChoicesIds = [];
        for (let i=0; i<choices.length; i++) {
            idx = Math.floor(Math.random() * choices.length);
            shuffledChoices.splice(idx, 0, choices[i]);
            shuffledChoicesIds.splice(idx, 0, choicesIds[i]);
        }
        for (let i=0; i<shuffledChoices.length; i++) {
            answersItems += `<label class="rubric-item-text">
                                <span class="checkbox-area">
                                    <input type="checkbox">
                                    <span class="checkmark">
                                        <img src="images/svg/Checkmark.svg" loading=“lazy” decoding=“async” alt="Check">
                                    </span>
                                </span>
                                <div class="challenge-answer" data-choice-id="`+ shuffledChoicesIds[i].toString() +  `">` + 
                                    shuffledChoices[i] +
                                    `<span class="explanation">Show explanation</span>
                                </div>
                            </label>`;
        }
        answersItems += `   <div class="challenge-actions">
                                <div class="challenge-result">
                                    <img src="images/svg/Star3.svg" loading=“lazy” decoding=“async” alt="Star">
                                    Almost! 2/3 are correct.
                                </div>
                                <div class="challenge-submit">
                                    Submit
                                </div>
                            </div>
                        </div>`;
        let class_ = (whatToGradeType == "img-all-cols" || whatToGradeType == "text") ?
                                        "challenge-plus-answers challenge-plus-answers-col" : "challenge-plus-answers";
        if (whatToGradeType == "text") {
            if (whatToGrade[questionIdx].includes("https://")) {
                let nameAndUrl = whatToGrade[questionIdx].split("https://");
                let name = nameAndUrl[0];
                let url = nameAndUrl[1];
                rubricItemTexts += `<div class="` + class_ + `">
                                        <div class="text-to-grade what-to-grade" data-what-to-grade-id="`+ whatToGradeIds[questionIdx] + `">` +
                                             `Document: <a class="what-to-grade-link" href="https://` + url + `" target="_blank">` + name + `</a>` + 
                                        `</div>` +
                                        answersItems +
                                    `</div>`;
            }
            else {
                rubricItemTexts += `<div class="` + class_ + `">
                                        <div class="text-to-grade what-to-grade" data-what-to-grade-id="`+ whatToGradeIds[questionIdx] + `">` + whatToGrade[questionIdx] + `</div>` +
                                        answersItems +
                                    `</div>`;
            }
        }
        else {
            rubricItemTexts += `<div class="` + class_ + `">
                                    <img class="what-to-grade" data-what-to-grade-id="`+ whatToGradeIds[questionIdx] + `" src="images/` + whatToGrade[questionIdx] + `" loading=“lazy” decoding=“async” alt="Question image">` + 
                                    answersItems +
                                `</div>`;
        }
    }
    let content =   `<div class="tool-content-container">
                            <div class="rubric-item">` +
                                rubricItemTexts +
                            `</div>
                            <div class="change-content-container">
                                <div class="change-content">
                                    <div class="change-content-text next">Start</div>
                                    <div class="change-content-pointy-end change-content-right-pointy-end"></div>
                                </div>  
                                <div class="change-content">
                                    <div class="change-content-pointy-end change-content-left-pointy-end"></div>
                                    <div class="change-content-text prev">Previous</div>
                                </div>
                            </div>
                    </div>`;
    toolContent.innerHTML = content;
    let contentChangers = document.getElementsByClassName("change-content");
    let previous = contentChangers[1];
    let next = contentChangers[0];
    if (activeMenuIdx == 0) {
        if (questionIdx == -1) {
            previous.classList.add("hidden");
        }
    }
    if (activeToggleOption != "presentation") {
        if (activeMenuIdx + 1 == subtitles_count && questionIdx + 1 == whatToGrade.length) {
            next.style.opacity = "0";
            next.style.cursor = "auto";
        }
        else {
            if (questionIdx != -1) {
                next.firstElementChild.innerHTML = "Next";
            }
        }
    }
    else {
        let rubricItemTxts = document.getElementsByClassName("rubric-item-text");
        rubricItemTxts[rubricItemTxts.length-1].style.marginBottom = "85px"; // same as the margin-bottom of .check-understanding class
        // @ css/partials/rubric.css (b/c Presentation has no challenges, there is no .check-understanding and thus no margin-bottom,
        // so we add it here)
        if (activeMenuIdx + 1 == subtitles_count) {
            next.style.opacity = "0";
            next.style.cursor = "auto";
        }
        else {
            next.firstElementChild.innerHTML = "Next";
        }
    }
    document.getElementsByClassName("prev")[0].addEventListener("click", onPrevRubricClick);
    document.getElementsByClassName("next")[0].addEventListener("click", onNextRubricClick);
    let challengeSumbit = document.getElementsByClassName("challenge-submit");
    if (challengeSumbit.length != 0) {
        challengeSumbit[0].addEventListener("click", onChallengeSubmitClick);
    }
    onWindowResize();
}

function isImage(img) {
    return img instanceof HTMLImageElement;
}

function onChallengeSubmitClick() {
    let challengeSubmit = document.getElementsByClassName("challenge-submit")[0];
    if (challengeSubmit.innerText == "Retry") {
        generateRubricItem();
    }
    else {
        let question = document.getElementsByClassName("what-to-grade")[0];
        let questionId = question.dataset.whatToGradeId;
        let questionDescription;
        if (isImage(question)) {
            questionDescription = question.src;
        }
        else {
            questionDescription = question.innerText;
        }
        let answers = document.getElementsByClassName("challenge-answer");
        let answersIds = [];
        let answersDescriptions = [];
        for (let answer of answers) {
            if (answer.previousElementSibling.firstElementChild.checked) {
                answersIds.push(answer.dataset.choiceId);
                answersDescriptions.push(answer.innerText)
            }
        }
        axios({
            method: "post",
            url: "/submit-activity",
            data: {
                questionId: questionId,
                questionDescription: questionDescription,
                answersIds: answersIds,
                answersDescriptions: answersDescriptions
            },
            headers: { "Content-Type": "application/json" },
        })
        .then (function (response) {
            // if error
            if (response.data.errors) {
                // error. please try again
            }
            // if success
            else {
                let results = response.data.success.results;
                let explanations = response.data.success.explanations;
                let correctCount = 0;
                let incorrectCount = 0;
                for (let answer of answers) {
                    if (results[answer.dataset.choiceId] == "1") {
                        answer.parentElement.classList.remove("incorrect");
                        answer.parentElement.classList.add("correct");
                        correctCount += 1;
                    }
                    else {
                        answer.parentElement.classList.remove("correct");
                        answer.parentElement.classList.add("incorrect");
                        incorrectCount += 1;
                    }
                    let checkbox = answer.previousElementSibling.firstElementChild;
                    checkbox.disabled = true;
                    let showExplanation = answer.firstElementChild;
                    showExplanation.innerHTML += `<span class="explanation-tooltip">` + explanations[answer.dataset.choiceId] + `</span>`;
                    showExplanation.classList.add("visible");
                }
                let challengeResult = document.getElementsByClassName("challenge-result")[0];
                if (incorrectCount == 0) {
                    challengeResult.innerText = "Excellent! " + correctCount.toString() + "/" + correctCount.toString() + " are correct."
                }
                else {
                    if (correctCount == 0) {
                        challengeResult.innerText = "Oh no! " + (0).toString() + "/" + incorrectCount.toString() + " are correct."
                    }
                    else {
                        if (incorrectCount == 1) {
                            challengeResult.innerText = "Almost! " + correctCount.toString() + "/" + (correctCount + incorrectCount).toString() + " are correct."
                        }
                        else {
                            challengeResult.innerText = "Nice try! " + correctCount.toString() + "/" + (correctCount + incorrectCount).toString() + " are correct."
                        }
                    }
                }
                challengeResult.classList.add("visible");
                challengeSubmit.innerText = "Retry";
            }
        })
        .catch (function (error) {
            // error. please try again
        })
    }
}

function onPrevRubricClick() {
    if (activeToolHeaderOption == "rubric") {
        let subtitles = document.getElementsByClassName("rubric-subtitle");
        if (activeToggleOption == "pentachart") {
            let questionIdx = pentachartRubricData[activeSideMenuPentachartIdx].questionIdx;
            if (questionIdx == -1) {
                if (activeSideMenuPentachartIdx != 0) {
                    subtitles[activeSideMenuPentachartIdx-1].click();
                }
            }
            else {
                pentachartRubricData[activeSideMenuPentachartIdx].questionIdx = questionIdx - 1;
                generateRubricItem();
            }
        }
        else if (activeToggleOption == "research") {
            let questionIdx = researchRubricData[activeSideMenuResearchIdx].questionIdx;
            if (questionIdx == -1) {
                if (activeSideMenuResearchIdx != 0) {
                    subtitles[activeSideMenuResearchIdx-1].click();
                }
            }
            else {
                researchRubricData[activeSideMenuResearchIdx].questionIdx = questionIdx - 1;
                generateRubricItem();
            }
        } else {
            if (activeSideMenuPresentationIdx != 0) {
                subtitles[activeSideMenuPresentationIdx-1].click();
            }
        }
    }
}

function onNextRubricClick() {
    if (activeToolHeaderOption == "rubric") {
        let subtitles = document.getElementsByClassName("rubric-subtitle");
        if (activeToggleOption == "pentachart") {
            let questionIdx = pentachartRubricData[activeSideMenuPentachartIdx].questionIdx;
            let questionCount = pentachartRubricData[activeSideMenuPentachartIdx].whatToGrade.length;
            if (questionIdx + 1 == questionCount) {
                if (activeSideMenuPentachartIdx + 1 < subtitles.length) {
                    subtitles[activeSideMenuPentachartIdx+1].click();
                }
            }
            else {
                pentachartRubricData[activeSideMenuPentachartIdx].questionIdx = questionIdx + 1;
                generateRubricItem();
            }
        }
        else if (activeToggleOption == "research") {
            let questionIdx = researchRubricData[activeSideMenuResearchIdx].questionIdx;
            let questionCount = researchRubricData[activeSideMenuResearchIdx].whatToGrade.length;
            if (questionIdx + 1 == questionCount) {
                if (activeSideMenuResearchIdx + 1 < subtitles.length) {
                    subtitles[activeSideMenuResearchIdx+1].click();
                }
            }
            else {
                researchRubricData[activeSideMenuResearchIdx].questionIdx = questionIdx + 1;
                generateRubricItem();
            }
        }
        else {
            if (activeSideMenuPresentationIdx + 1 < subtitles.length) {
                subtitles[activeSideMenuPresentationIdx+1].click();
            }
        }
    }

}

function generateSelfAssessmentItem() {
    let placeholder;
    let old_text;
    if (activeToggleOption == "presentation") {
        placeholder = "Here goes your Presentation speech...";
        old_text = presentationSelfText;
    }
    else if (activeToggleOption == "research") {
        placeholder = "Here goes your Research Proposal...";
        old_text = researchSelfText;
    }
    else {
        placeholder = "Here goes your Pentachart...";
        old_text = pentachartSelfText;
    }
    let navigator = window.navigator;
    let grammarlyExtensionUrl;
    let proWritingAidExtensionUrl;
    let platform;
    if (navigator.vendor == "Google Inc.") {
        // Chrome, Brave, Opera
        platform = "Chrome/Brave/Opera";
        grammarlyExtensionUrl = "https://chrome.google.com/webstore/detail/grammarly-grammar-checker/kbfnbcaeplbcioakkpcpgfkobkghlhen";
        proWritingAidExtensionUrl = "https://chrome.google.com/webstore/detail/prowritingaid-grammar-che/npnbdojkgkbcdfdjlfdmplppdphlhhcf";
    }
    else if (navigator.vendor == "Apple Computer, Inc.") {
        // Safari (web or mobile)
        platform = "Safari"
        grammarlyExtensionUrl = "https://apps.apple.com/us/developer/grammarly-inc/id1134927945";
        proWritingAidExtensionUrl = "https://prowritingaid.com/en/App/SafariExtension";
    }
    // You can check for more browsers
    else {
        // Firefox
        platform = "Firefox"
        grammarlyExtensionUrl = "https://www.grammarly.com/browser/firefox";
        proWritingAidExtensionUrl = "https://prowritingaid.com/en/App/FirefoxExtension";
    }
    let content = ` <div class="tool-content-container">
                        <div class="text-analysis-container">
                            <div class="text-analysis">
                                <div class="text-analysis-stat" id="good-readability">
                                    <img src="images/svg/Checkmark2.svg" loading=“lazy” decoding=“async” alt="Checkmark">
                                    Good readability
                                    <img class="information" src="images/svg/Information2.svg" loading=“lazy” decoding=“async” alt="Information">
                                    <span class="text-analysis-stat-tooltip" id="good-readability-tooltip">0 instances of unnecessary words</span>
                                </div>
                                <div class="text-analysis-stat" id="impersonal-style">
                                    <img src="images/svg/Checkmark2.svg" loading=“lazy” decoding=“async” alt="Checkmark">
                                    Impersonal style
                                    <img class="information" src="images/svg/Information2.svg" loading=“lazy” decoding=“async” alt="Information">
                                    <span class="text-analysis-stat-tooltip" id="impersonal-style-tooltip">0 instances of 'I', 'my', 'me', 'you' or 'your'</span>
                                </div>
                            </div>
                            <div class="text-analysis">
                                <div class="text-analysis-stat" id="no-contractions">
                                    <img src="images/svg/Checkmark2.svg" loading=“lazy” decoding=“async” alt="Checkmark">
                                     No contractions
                                    <img class="information" src="images/svg/Information2.svg" loading=“lazy” decoding=“async” alt="Information">
                                    <span class="text-analysis-stat-tooltip" id="no-contractions-tooltip">0 instances of contractions</span>
                                </div>
                                <div class="text-analysis-stat" id="formal-start">
                                    <img src="images/svg/Checkmark2.svg" loading=“lazy” decoding=“async” alt="Checkmark">
                                    Formal start
                                    <img class="information" src="images/svg/Information2.svg" loading=“lazy” decoding=“async” alt="Information">
                                    <span class="text-analysis-stat-tooltip" id="formal-start-tooltip">0 instances of informal start</span>
                                </div>
                            </div>
                            <div class="text-analysis">
                                <div class="text-analysis-stat" id="no-weasel-words">
                                    <img src="images/svg/Checkmark2.svg" loading=“lazy” decoding=“async” alt="Checkmark">
                                    No weasel words
                                    <img class="information" src="images/svg/Information2.svg" loading=“lazy” decoding=“async” alt="Information">
                                    <span class="text-analysis-stat-tooltip" id="no-weasel-words-tooltip">0 instances of weasel words</span>
                                </div>
                                <div class="text-analysis-stat" id="no-cliches">
                                    <img src="images/svg/Checkmark2.svg" loading=“lazy” decoding=“async” alt="Checkmark">
                                    No cliches
                                    <img class="information" src="images/svg/Information2.svg" loading=“lazy” decoding=“async” alt="Information">
                                    <span class="text-analysis-stat-tooltip" id="no-cliches-tooltip">0 instances of common cliches</span>
                                </div>
                            </div>
                        </div>
                        <textarea class="text-box" placeholder="` + placeholder + `">` + old_text + `</textarea>
                        <div id="word-count">Word count: 0</div>
                        <div class="add-grammarly-extension-container">
                            Using `+ platform + `?
                            Add
                            <a class="add-grammarly-extension" target="_blank" href="`+ grammarlyExtensionUrl +  `"> Grammarly</a>
                            and
                            <a class="add-grammarly-extension" target="_blank" href="`+ proWritingAidExtensionUrl +  `"> ProWritingAid</a>
                            to Rubrik to further your analysis!
                        </div>
                        <div class="analyze-btns-container">
                            <a class="download-analysis-btn"><img src="images/svg/Download.svg" loading=“lazy” decoding=“async” alt="Download">Download analysis</a>
                            <a class="analyze-text-btn">Analyze writing</a>
                        </div>
                    </div>`;
    toolContent.innerHTML = content;
    document.getElementsByClassName("analyze-text-btn")[0].addEventListener("click", getTextAnalysis);
    document.getElementsByClassName("download-analysis-btn")[0].addEventListener("click", downloadAnalysis);
    let textBox = document.getElementsByClassName("text-box")[0];
    textBox.addEventListener("paste", (e) => {
        e.preventDefault();
        let text = e.clipboardData.getData('text/plain');
        if (activeToggleOption == "pentachart") {
            pentachartSelfText = text;
        }
        else if (activeToggleOption == "research") {
            researchSelfText = text;
        }
        else {
            presentationSelfText = text;
        }
        document.execCommand('insertText', false, text)
    });
    textBox.addEventListener("input", onSelfTextChange);
    onWindowResize();
}

function onSelfTextChange() {
    if (activeToggleOption == "pentachart") {
        pentachartSelfText = this.value.toString();
    }
    else if (activeToggleOption == "research") {
        researchSelfText = this.value.toString();
    }
    else {
        presentationSelfText = this.value.toString();
    }
}

function downloadAnalysis() {
    let text =  document.getElementsByClassName("text-box")[0].value;
    if (text != "") {
        let analysis;
        if (activeToggleOption == "pentachart") {
            analysis = pentachartSelfTextAnalysis;
        }
        else if (activeToggleOption == "research") {
            analysis = researchSelfTextAnalysis;
        }
        else {
            analysis = presentationSelfTextAnalysis;
        }
        if (analysis != undefined) {
            let title = activeToggleOption.charAt(0).toUpperCase() + activeToggleOption.slice(1); /* capitalize initial letter */
            let bodyRows = [
                // header row
                [
                    {
                        text: 'Item',
                        style: ['tableHeader', 'gray']
                    },
                    {
                        text: 'Description',
                        style: ['tableHeader', 'gray']
                    }
                ]
            ];
            let i;
            if (analysis.length == 0) {
                bodyRows.push([
                    // regular row
                    {
                        text: "0",
                        style: ['tableCell', 'red']
                    },
                    {
                        text: "Hurray! You're all set.",
                        style: ['tableCell', 'red']
                    }
                ])
            }
            else {
                for (i=0; i<analysis.length; i++) {
                    bodyRows.push([
                        // regular row
                        {
                            text: (i+1).toString(),
                            style: ['tableCell', 'red']
                        },
                        {
                            text: analysis[i].reason,
                            style: ['tableCell', 'red']
                        }
                    ])
                }
            }
            let documentDefinition = {
                pageOrientation: 'landscape',
                content: [
                    {
                        text:  'Analysis [' + title + ']\n\n',
                        style: 'header'
                    },
                    {
                        text: 'This tool is still in experimental stages. Use this feedback with caution and when in doubt, always refer to your tutor. If you would like to help improve Rubrik as part of your Practicum and/or Final Year Project, contact one of your professors!\n\n',
                        style: 'small'
                    },
                    {
                        table: {
                            // headers are automatically repeated if the table spans over multiple pages
                            // you can declare how many rows should be treated as headers
                            headerRows: 1,
                            widths: [ '20%', '80%' ],
                            body: bodyRows,
                        }
                    }
                ],
                styles: {
                    header: {
                        fontSize: 16,
                        bold: true,
                        alignment: 'center'
                    },
                    tableHeader: {
                        bold: true,
                        fontSize: 11,
                    },
                    tableCell: {
                        fontSize: 11,
                        lineHeight: 1.1,
                    },
                    gray: {
                        fillColor: '#D9D9D9',
                    },
                    red: {
                        fillColor: '#E6D2DC',
                    },
                    small: {
                        fontSize: 10.5,
                    }
        
                }	
            }
            pdfMake.createPdf(documentDefinition).download(title);
        }
    }
}

function getTextAnalysis() {
    let textBox = document.getElementsByClassName("text-box")[0];
    let textBoxContent = textBox.value;
    if (textBoxContent != "") {
        axios({
            method: "post",
            url: "/analyze-text",
            data: {
                textBoxContent: textBoxContent,
            },
            headers: { "Content-Type": "application/json" },
          }).then(function (response) {
              // if error
              if (response.data.errors) {
                  if (response.data.errors.textLengthZero) {
                      //response.data.errors.textLengthZero
                  }
                  else {
                      // generalError
                      // response.data.generalError;
                  }
              }
              // if success
              else {
                  // contractions
                  let contractions = response.data.success.contractionMatches;
                  let noContractions = document.getElementById("no-contractions");
                  let contractionCount = 0;
                  for (let contraction of contractions) { // different contractions
                      contractionCount += contraction.length; // ocurrences for same contraction
                  }
                  let noContractionsTooltip = document.getElementById("no-contractions-tooltip");
                  if (contractionCount > 0) {
                      noContractions.firstElementChild.src = `images/svg/Alert2.svg`;
                      noContractions.firstElementChild.alt = `Alert`;
                      if (contractionCount == 1) {
                          noContractionsTooltip.innerText = contractionCount + ` instance of contractions`;
                      }
                      else {
                          noContractionsTooltip.innerText = contractionCount + ` instances of contractions`;
                      }
                  }
                  else {
                      noContractions.firstElementChild.src = `images/svg/Checkmark2.svg`;
                      noContractions.firstElementChild.alt = `Checkmark`;
                      noContractionsTooltip.innerText = contractionCount + ` instances of contractions`;
                  }

                  // impersonal style
                  let ICount = response.data.success.IInstances == null ? 0 : response.data.success.IInstances.length;
                  let myCount = response.data.success.myInstances == null ? 0 : response.data.success.myInstances.length;
                  let meCount = response.data.success.meInstances == null ? 0 : response.data.success.meInstances.length;
                  let youCount = response.data.success.youInstances == null ? 0 : response.data.success.youInstances.length;
                  let yourCount = response.data.success.yourInstances == null ? 0 : response.data.success.yourInstances.length;
                  let impersonalStyle = document.getElementById("impersonal-style");
                  let personalStyleCount = ICount + myCount + meCount + youCount + yourCount;
                  let impersonalStyleTooltip = document.getElementById("impersonal-style-tooltip");
                  let impersonalStyleMessage = ""
                  if (personalStyleCount > 0) {
                      impersonalStyle.firstElementChild.src = `images/svg/Alert2.svg`;
                      impersonalStyle.firstElementChild.alt = `Alert`;
                      if (personalStyleCount == 1) {
                          impersonalStyleMessage = personalStyleCount + ` instance of 'I', 'my', 'me', 'you' or 'your'`;
                          impersonalStyleTooltip.innerText = impersonalStyleMessage;
                      }
                      else {
                          impersonalStyleMessage = personalStyleCount + ` instances of 'I', 'my', 'me', 'you' or 'your'`;
                          impersonalStyleTooltip.innerText = impersonalStyleMessage;
                      }
                  }
                  else {
                    impersonalStyle.firstElementChild.src = `images/svg/Checkmark2.svg`;
                    impersonalStyle.firstElementChild.alt = `Checkmark`;
                    impersonalStyleMessage = personalStyleCount + ` instances of 'I', 'my', 'me', 'you' or 'your'`;
                    impersonalStyleTooltip.innerText = impersonalStyleMessage;
                  }
                  // general analysis (to download)
                  if (activeToggleOption == "pentachart") {
                      pentachartSelfTextAnalysis = response.data.success.writeGoodSuggestions;
                      if (personalStyleCount != 0) {
                          pentachartSelfTextAnalysis.push({
                              "reason": impersonalStyleMessage
                          });
                      }
                      for (let contraction of contractions) {
                          pentachartSelfTextAnalysis.push({
                              "reason": `"`+ contraction[0].toLowerCase() + `" is a contraction`
                          });
                      }
                  }
                  else if (activeToggleOption == "research") {
                      researchSelfTextAnalysis = response.data.success.writeGoodSuggestions;
                      if (personalStyleCount != 0) {
                          researchSelfTextAnalysis.push({
                              "reason": impersonalStyleMessage
                          });
                      }
                      for (let contraction of contractions) {
                        researchSelfTextAnalysis.push({
                            "reason": `"`+ contraction[0].toLowerCase() + `" is a contraction`
                        });
                      }
                  }
                  else {
                      presentationSelfTextAnalysis = response.data.success.writeGoodSuggestions;
                      if (personalStyleCount != 0) {
                        presentationSelfTextAnalysis.push({
                            "reason": impersonalStyleMessage
                        });
                      }
                      for (let contraction of contractions) {
                        presentationSelfTextAnalysis.push({
                            "reason": `"`+ contraction[0].toLowerCase() + `" is a contraction`
                        });
                      }
                  }
                  // word count
                  let wordCount = document.getElementById("word-count");
                  wordCount.innerText = "Word count: " + response.data.success.wordCount;
                  // formal start
                  let formalStart = document.getElementById("formal-start");
                  let informalStartCount = response.data.success.informalStartCount;
                  let formalStartTooltip = document.getElementById("formal-start-tooltip");
                  if (informalStartCount > 0) {
                    formalStart.firstElementChild.src = `images/svg/Alert2.svg`;
                    formalStart.firstElementChild.alt = `Alert`;
                    if (informalStartCount == 1) {
                        formalStartTooltip.innerText = informalStartCount + ` instance of informal start`;
                    }
                    else {
                        formalStartTooltip.innerText = informalStartCount + ` instances of informal start`;
                    }
                  }
                  else {
                    formalStart.firstElementChild.src = `images/svg/Checkmark2.svg`;
                    formalStart.firstElementChild.alt = `Checkmark`;
                    formalStartTooltip.innerText = informalStartCount + ` instances of informal start`;
                  }
                  // no weasel words
                  let noWeaselWords = document.getElementById("no-weasel-words");
                  let weaselWordCount = response.data.success.weaselWordCount;
                  let noWeaselWordsTooltip = document.getElementById("no-weasel-words-tooltip");
                  if (weaselWordCount > 0) {
                      noWeaselWords.firstElementChild.src = `images/svg/Alert2.svg`;
                      noWeaselWords.firstElementChild.alt = `Alert`;
                      if (weaselWordCount == 1) {
                        noWeaselWordsTooltip.innerText = weaselWordCount + ` instance of a weasel word`;
                      }
                      else {
                        noWeaselWordsTooltip.innerText = weaselWordCount + ` instances of weasel words`;
                      }
                  }
                  else {
                    noWeaselWords.firstElementChild.src = `images/svg/Checkmark2.svg`;
                    noWeaselWords.firstElementChild.alt = `Checkmark`;
                    noWeaselWordsTooltip.innerText = weaselWordCount + ` instances of weasel words`;
                  }
                  // good readability
                  let goodReadability = document.getElementById("good-readability");
                  unnecessaryWordCount = response.data.success.unnecessaryWordCount;
                  let goodReadabilityTooltip = document.getElementById("good-readability-tooltip");
                  if (unnecessaryWordCount > 0) {
                    goodReadability.firstElementChild.src = `images/svg/Alert2.svg`;
                    goodReadability.firstElementChild.alt = `Alert`;
                      if (unnecessaryWordCount == 1) {
                        goodReadabilityTooltip.innerText = unnecessaryWordCount + ` instance of an unnecessary word`;
                      }
                      else {
                        goodReadabilityTooltip.innerText = unnecessaryWordCount + ` instances of unnecessary words`;
                      }
                  }
                  else {
                    goodReadability.firstElementChild.src = `images/svg/Checkmark2.svg`;
                    goodReadability.firstElementChild.alt = `Checkmark`;
                    goodReadabilityTooltip.innerText = unnecessaryWordCount + ` instances of unnecessary words`;
                  }
                  // no cliches
                  let noCliches = document.getElementById("no-cliches");
                  let clicheCount = response.data.success.clicheCount;
                  let noClichesTooltip = document.getElementById("no-cliches-tooltip");
                  if (clicheCount > 0) {
                    noCliches.firstElementChild.src = `images/svg/Alert2.svg`;
                    noCliches.firstElementChild.alt = `Alert`;
                    if (clicheCount == 1) {
                        noClichesTooltip.innerText = clicheCount + ` instance of a common cliche`;
                    }
                    else {
                        noClichesTooltip.innerText = clicheCount + ` instances of common cliches`;
                    }
                  }
                  else {
                    noCliches.firstElementChild.src = `images/svg/Checkmark2.svg`;
                    noCliches.firstElementChild.alt = `Checkmark`;
                    noClichesTooltip.innerText = clicheCount + ` instances of common cliches`;
                  }
              }
          }).catch(function (error) {
              // error. please try again
          })
    }
}

/*  The title arouses interest and reflects tone.
    The subtitle provides additional information of the research idea.
    1, 2, 3, 4
    Justify your answer
    Previous Next/Download
*/
function generatePeerScoreItem() {
    let items;
    let textareaValue = ``;
    let givenScoreIdex;
    let subtitles_count;
    let currentScore;
    let activeMenuIdx;
    if (activeToggleOption == "pentachart") {
        items = pentachartPeerData[activeSideMenuPentachartIdx].description;
        givenScoreIdex = pentachartPeerData[activeSideMenuPentachartIdx].scoreIdx;
        textareaValue = pentachartPeerData[activeSideMenuPentachartIdx].justification;
        subtitles_count = pentachartPeerData.length;
        currentScore = pentachartScore;
        activeMenuIdx = activeSideMenuPentachartIdx;
    }
    else if (activeToggleOption == "research") {
        items = researchPeerData[activeSideMenuResearchIdx].description;
        givenScoreIdex = researchPeerData[activeSideMenuResearchIdx].scoreIdx;
        textareaValue = researchPeerData[activeSideMenuResearchIdx].justification;
        subtitles_count = researchPeerData.length;
        currentScore = researchScore;
        activeMenuIdx = activeSideMenuResearchIdx;
    }
    else {
        items = presentationPeerData[activeSideMenuPresentationIdx].description;
        givenScoreIdex = presentationPeerData[activeSideMenuPresentationIdx].scoreIdx;
        textareaValue = presentationPeerData[activeSideMenuPresentationIdx].justification;
        subtitles_count = presentationPeerData.length;
        currentScore = presentationScore;
        activeMenuIdx = activeSideMenuPresentationIdx;
    }
    let rubricItemTexts = ``;
    for (let item of items) {
        rubricItemTexts += `<div class="rubric-item-text">
                                <span>
                                    <img src="images/svg/TooltipSquare.svg" loading=“lazy” decoding=“async” alt="Tooltip">
                                </span>
                                <div>`+ item + `</div>
                            </div>`;
    }
    let rubricItemScores = ``;
    for (let score of toolData[activeToggleOption].peerAssessment.scoreOptions) {
        rubricItemScores += `<div class="rubric-item-score">` + 
                                score +
                            `</div>`;
    }
    currentScore = currentScore == -1 ? toolData[activeToggleOption].peerAssessment.scoreOptions[0] * subtitles_count : currentScore;
    let maximumScore = toolData[activeToggleOption].peerAssessment.scoreOptions.at(-1) * subtitles_count;
    let content = `<div class="tool-content-container">
                        <div class="total-score">
                            Total Score: ` + currentScore + `<span>/` + maximumScore + `</span>
                            <span id="zero-to-ten-score">` + (10*currentScore/maximumScore).toFixed(1) + `</span>
                        </div>
                        <div class="rubric-item">` +
                            rubricItemTexts +
                            `<div class="rubric-item-scores-container">
                                    <div class="rubric-item-scores">` +
                                        rubricItemScores +
                                    `</div>
                                    <div class="rubric-item-score-description">` + toolData[activeToggleOption].peerAssessment.scores[0] + `</div>
                            </div>
                            <textarea class="rubric-item-justification" placeholder="Justify your choice..." ></textarea>
                        </div>
                        <div class="change-content-container">
                            <div class="change-content">
                                <div class="change-content-text next">Next</div>
                                <div class="change-content-pointy-end change-content-right-pointy-end"></div>
                            </div>  
                            <div class="change-content">
                                <div class="change-content-pointy-end change-content-left-pointy-end"></div>
                                <div class="change-content-text prev">Previous</div>
                            </div>
                        </div>
                  </div>`;
    toolContent.innerHTML = content;
    rubricItemScores = document.getElementsByClassName("rubric-item-score"); /* 1, 2, 3, 4 */
    for (let rubricItemScore of rubricItemScores) {
        rubricItemScore.addEventListener("click", onRubricItemScoreUpdate);
    }
    if (givenScoreIdex == -1) {
        rubricItemScores[0].classList.add("rubric-item-score-active");
    }
    else {
        for (let i=0; i<=givenScoreIdex; i++) {
            rubricItemScores[i].classList.add("rubric-item-score-active");
        }
        document.getElementsByClassName("rubric-item-score-description")[0].innerHTML =  toolData[activeToggleOption].peerAssessment.scores[givenScoreIdex];
    }
    let justification = document.getElementsByClassName("rubric-item-justification")[0];
    justification.value = textareaValue;
    justification.addEventListener("input", onJustificationChange);
    let contentChangers = document.getElementsByClassName("change-content");
    let previous = contentChangers[1];
    let next = contentChangers[0];
    if (activeMenuIdx == 0) {
        previous.classList.add("hidden");
    }
    if (activeMenuIdx == subtitles_count-1) {
        next.firstElementChild.innerHTML = "Download";
        next.firstElementChild.style.fontSize = "15.25px";
    }
    document.getElementsByClassName("prev")[0].addEventListener("click", onPrevPeerClick);
    document.getElementsByClassName("next")[0].addEventListener("click", onNextPeerClick);
    onWindowResize();
}

/* Previous */
function onPrevPeerClick() {
    if (activeToolHeaderOption == "peerAssessment") {
        let subtitles = document.getElementsByClassName("rubric-subtitle");
        if (activeToggleOption == "pentachart") {
            if (activeSideMenuPentachartIdx != 0) {
                subtitles[activeSideMenuPentachartIdx-1].click();
            }
        }
        else if (activeToggleOption == "research") {
            if (activeSideMenuResearchIdx != 0) {
                subtitles[activeSideMenuResearchIdx-1].click();
            }
        }
        else {
            if (activeSideMenuPresentationIdx != 0) {
                subtitles[activeSideMenuPresentationIdx-1].click();
            }
        }
    }
}

/* Next (or Download) */
function onNextPeerClick() {
    if (activeToolHeaderOption == "peerAssessment") {
        let subtitles = document.getElementsByClassName("rubric-subtitle");
        if (activeToggleOption == "pentachart") {
            if (activeSideMenuPentachartIdx + 1 < subtitles.length) {
                subtitles[activeSideMenuPentachartIdx+1].click();
            }
            else {
                downloadPeerAssessment();
            }
        }
        else if (activeToggleOption == "research") {
            if (activeSideMenuResearchIdx + 1 < subtitles.length) {
                subtitles[activeSideMenuResearchIdx+1].click();
            }
            else {
                downloadPeerAssessment();
            }
        }
        else {
            if (activeSideMenuPresentationIdx + 1 < subtitles.length) {
                subtitles[activeSideMenuPresentationIdx+1].click();
            }
            else {
                downloadPeerAssessment();
            }
        }
    }
}

/* Update stored justification with newly entered information */
function onJustificationChange() {
    if (activeToolHeaderOption == "peerAssessment") {
        if (activeToggleOption == "pentachart") {
            pentachartPeerData[activeSideMenuPentachartIdx].justification = this.value.toString();
        }
        else if (activeToggleOption == "research") {
            researchPeerData[activeSideMenuResearchIdx].justification = this.value.toString();
        }
        else {
            presentationPeerData[activeSideMenuPresentationIdx].justification = this.value.toString();
        }
    }
}

/* Navigate between the options [rubric-subtitle] of the left side menu */
function changeActiveSubtitle() {
    let subtitles = document.getElementsByClassName("rubric-subtitle");
    for (let i=0; i<subtitles.length; i++) {
        subtitles[i].classList.remove("rubric-subtitle-active");
        if (subtitles[i] == this) {
            this.classList.add("rubric-subtitle-active");
            if (activeToggleOption == "pentachart") {
                activeSideMenuPentachartIdx = i;
            }
            else if (activeToggleOption == "research") {
                activeSideMenuResearchIdx = i;
            }
            else {
                activeSideMenuPresentationIdx = i;
            }
        }
    }
    if (activeToolHeaderOption == "peerAssessment") {
        generatePeerScoreItem();
    }
    else if (activeToolHeaderOption == "rubric") {
        generateRubricItem();
    }
    else {
        generateSelfAssessmentItem();
    }
}

/* 1, 2, 3, 4 */
function onRubricItemScoreUpdate() {
    if (activeToolHeaderOption == "peerAssessment") {
        let sigleMinScore = toolData[activeToggleOption].peerAssessment.scoreOptions[0];
        let sigleMaxScore = toolData[activeToggleOption].peerAssessment.scoreOptions.at(-1);
        let totalMaxScore = 0;
        let totalScore = 0;
        let rowItemScores = this.parentElement.children;
        let addActive = true;
        for (let i=0; i<rowItemScores.length; i++) {
            if (addActive) {
                rowItemScores[i].classList.add("rubric-item-score-active");
            }
            else {
                rowItemScores[i].classList.remove("rubric-item-score-active");
            }
            if (rowItemScores[i] == this) {
                addActive = false;
                this.parentElement.nextElementSibling.innerHTML = toolData[activeToggleOption][activeToolHeaderOption].scores[i];
                if (activeToggleOption == "pentachart") {
                    pentachartPeerData[activeSideMenuPentachartIdx].scoreIdx = i;
                }
                else if (activeToggleOption == "research") {
                    researchPeerData[activeSideMenuResearchIdx].scoreIdx = i;
                }
                else {
                    presentationPeerData[activeSideMenuPresentationIdx].scoreIdx = i;
                }
            }
        }
        if (activeToggleOption == "pentachart") {
            for (let pentachartItem of pentachartPeerData) {
                totalMaxScore += sigleMaxScore;
                if (pentachartItem.scoreIdx == -1) {
                    totalScore += sigleMinScore;
                }
                else {
                    totalScore += parseInt(toolData[activeToggleOption][activeToolHeaderOption].scores[pentachartItem.scoreIdx]);
                }
            }
            pentachartScore = totalScore;
        }
        else if (activeToggleOption == "research") {
            for (let researchItem of researchPeerData) {
                totalMaxScore += sigleMaxScore;
                if (researchItem.scoreIdx == -1) {
                    totalScore += sigleMinScore;
                }
                else {
                    totalScore += parseInt(toolData[activeToggleOption][activeToolHeaderOption].scores[researchItem.scoreIdx]);
                }
            }
            researchScore = totalScore;
        }
        else {
            for (let presentationItem of presentationPeerData) {
                totalMaxScore += sigleMaxScore;
                if (presentationItem.scoreIdx == -1) {
                    totalScore += sigleMinScore;
                }
                else {
                    totalScore += parseInt(toolData[activeToggleOption][activeToolHeaderOption].scores[presentationItem.scoreIdx]);
                }
            }
            presentationScore = totalScore;
        }
        let scoreElement = document.getElementsByClassName("total-score")[0];
        scoreElement.innerHTML = `Total Score: ` + totalScore.toString() + `<span>/` + totalMaxScore.toString() + `</span>` + 
        `<span id="zero-to-ten-score">` + (10*totalScore/totalMaxScore).toFixed(1) + `</span>`;
    }
}

/* assessment rubric, self assessment, peer assessment */
function onToolHeaderUpdate() {
    let toolHeaderOptions = document.getElementsByClassName("tool-header-option");
    for (let toolHeaderOption of toolHeaderOptions) {
        toolHeaderOption.classList.remove("tool-header-option-active")
    }
    this.classList.add("tool-header-option-active");
    activeToolHeaderOption = this.dataset.option;
    if (activeToolHeaderOption == "peerAssessment") {
        generatePeerScoreItem();
    }
    else if (activeToolHeaderOption == "rubric") {
        generateRubricItem();
    }
    else {
        generateSelfAssessmentItem();
    }
    // toolContent.innerHTML = toolData[activeToggleOption][activeToolHeaderOption];
}

 /* pentachart, research proposal, presentation */
function onToggleUpdate() {
    activeToggleOption = this.dataset.option;
    if (activeToolHeaderOption == "peerAssessment") {
        generatePeerScoreItem(); // covers e.g. Pentachart & Peer -> Presentation & Peer (new peer content)
    }
    else if (activeToolHeaderOption == "rubric") {
        generateRubricItem();
    }
    else {
        generateSelfAssessmentItem();
    }
    // toolContent.innerHTML = toolData[activeToggleOption][activeToolHeaderOption];
    generateLeftSideMenu();
}

/* Download */
function downloadPeerAssessment() {
    let title = activeToggleOption.charAt(0).toUpperCase() + activeToggleOption.slice(1); /* capitalize initial letter */
    let scores = toolData[activeToggleOption].peerAssessment.scores;
    let scoresUl = [];
    for (let i=0; i<scores.length;i++) {
        if (i == scores.length - 1) {
            scoresUl.push( {
                text: scores[i] + '\n\n',
                listType: 'none'
            });
        }
        else {
            scoresUl.push( {
                text: scores[i],
                listType: 'none'
            });
        }
    }
    let bodyRows = [
        // header row
        [
            {
                text: 'Item',
                style: ['tableHeader', 'gray']
            },
            {
                text: 'Description',
                style: ['tableHeader', 'gray']
            },
            {
                text: 'Score',
                style: ['tableHeader', 'gray']
            },
            {
                text: 'Justification',
                style: ['tableHeader', 'gray']
            }
        ]
    ];
    let peerReview;
    let scoreOptions = toolData[activeToggleOption].peerAssessment.scoreOptions;
    let minScore = scoreOptions[0];
    let maxScore = scoreOptions.at(-1);
    let totalScore = 0;
    let totalMaxScore = 0;
    if (activeToggleOption == "pentachart") {
        peerReview = structuredClone(pentachartPeerData);
    }
    else if (activeToggleOption == "research") {
        peerReview = structuredClone(researchPeerData);
    }
    else {
        peerReview = structuredClone(presentationPeerData);
    }
    let i = 0;
    for (let category of toolData[activeToggleOption].rubric) {
        let issues = structuredClone(category.issues); // prevent Array change [pdfmake overrides Array?] causing
        // [object object] to appear after download and side menu change
        let score;
        for (let issue of issues) {
            if (peerReview[i].scoreIdx == -1) {
                score = minScore;
            }
            else {
                score = scoreOptions[peerReview[i].scoreIdx];
            }
            totalScore += score;
            totalMaxScore += maxScore;
            bodyRows.push([
                // regular row
                {
                    text: issue.title,
                    fillColor: category.bgColor,
                    style: ['tableCell']
                },
                {
                    ul: issue.description,
                    fillColor: category.bgColor,
                    style: ['tableCell', 'small']
                },
                {
                    text: score,
                    fillColor: category.bgColor,
                    style: ['tableCell']
                },
                {
                    text: peerReview[i].justification,
                    fillColor: category.bgColor,
                    style: ['tableCell', 'small']
                }
            ])
            i++;
        }
    }
    // final row
    bodyRows.push(
        [
            {
                text: 'Total Score',
                style: ['tableCell','gray']
            },
            {
                text: '',
                style: ['tableCell', 'gray']
            },
            {
                text: totalScore + '/' + totalMaxScore,
                style: ['tableCell', 'gray']
            },
            {
                text: '',
                style: ['tableCell', 'gray']
            }
        ]
    );
    let documentDefinition = {
        pageOrientation: 'landscape',
        content: [
            {
                text:  'Peer Group Assessment [' + title + ']\n\n',
                style: 'header'
            },
            {
                ul: scoresUl,
                style: 'tiny',
            },
            {
                table: {
                    // headers are automatically repeated if the table spans over multiple pages
                    // you can declare how many rows should be treated as headers
                    headerRows: 1,
                    widths: [ '12%', '46%', '6%', '36%' ],
                    body: bodyRows,
                }
            }
        ],
        styles: {
            header: {
                fontSize: 16,
                bold: true,
                alignment: 'center'
            },
            tableHeader: {
                bold: true,
                fontSize: 11,
            },
            tableCell: {
                fontSize: 11,
                lineHeight: 1.1,
            },
            gray: {
                fillColor: '#D9D9D9',
            },
            tiny: {
                fontSize: 10,
            },
            small: {
                fontSize: 10.5,
            }

        }	
    }
    pdfMake.createPdf(documentDefinition).download(title);
}