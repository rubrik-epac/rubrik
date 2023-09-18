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
                        let content = `
                        <div class="tool-content-container">
  <div class="text-analysis-container">
    <div class="text-analysis">
      <div class="text-analysis-stat" id="no-personal-style">
        <img src="images/svg/Checkmark2.svg" loading=“lazy” decoding=“async” alt="Checkmark"> No personal style <img class="information" src="images/svg/Information2.svg" loading=“lazy” decoding=“async” alt="Information">
        <span class="text-analysis-stat-tooltip" id="no-personal-style-tooltip">0 ocurrences of personal constructions</span>
      </div>
      <div class="text-analysis-stat" id="no-colloquialisms">
        <img src="images/svg/Checkmark2.svg" loading=“lazy” decoding=“async” alt="Checkmark"> No colloquialisms <img class="information" src="images/svg/Information2.svg" loading=“lazy” decoding=“async” alt="Information">
        <span class="text-analysis-stat-tooltip" id="no-colloquialisms-tooltip">0 ocurrences of \ncolloquial expressions</span>
      </div>
    </div>
    <div class="text-analysis">
      <div class="text-analysis-stat" id="no-contractions">
        <img src="images/svg/Checkmark2.svg" loading=“lazy” decoding=“async” alt="Checkmark"> No contractions <img class="information" src="images/svg/Information2.svg" loading=“lazy” decoding=“async” alt="Information">
        <span class="text-analysis-stat-tooltip" id="no-contractions-tooltip">0 ocurrences of \ncontractions</span>
      </div>
      <div class="text-analysis-stat" id="no-phrasal-verbs">
        <img src="images/svg/Checkmark2.svg" loading=“lazy” decoding=“async” alt="Checkmark"> No phrasal verbs <img class="information" src="images/svg/Information2.svg" loading=“lazy” decoding=“async” alt="Information">
        <span class="text-analysis-stat-tooltip" id="no-phrasal-verbs-tooltip">0 ocurrences of \nphrasal verbs</span>
      </div>
    </div>
    <div class="text-analysis">
      <div class="text-analysis-stat" id="no-informal-connectors">
        <img src="images/svg/Checkmark2.svg" loading=“lazy” decoding=“async” alt="Checkmark"> No informal connectors <img class="information" src="images/svg/Information2.svg" loading=“lazy” decoding=“async” alt="Information">
        <span class="text-analysis-stat-tooltip" id="no-informal-connectors-tooltip">0 ocurrences of \ninformal connectors</span>
      </div>
      <div class="text-analysis-stat" id="good-readability">
        <img src="images/svg/Checkmark2.svg" loading=“lazy” decoding=“async” alt="Checkmark"> Good readability <img class="information" src="images/svg/Information2.svg" loading=“lazy” decoding=“async” alt="Information">
        <span class="text-analysis-stat-tooltip" id="good-readability-tooltip">0 sentences/paragraphs \nare too long or too short </span>
      </div>
    </div>
    <div class="text-analysis">
      <div class="text-analysis-stat" id="tentative-language">
        <img src="images/svg/Checkmark2.svg" loading=“lazy” decoding=“async” alt="Checkmark"> Tentative language <img class="information" src="images/svg/Information2.svg" loading=“lazy” decoding=“async” alt="Information">
        <span class="text-analysis-stat-tooltip" id="tentative-language-tooltip">0 ocurrences of \ntentative language</span>
      </div>
      <div class="text-analysis-stat" id="in-text-citations">
        <img src="images/svg/Checkmark2.svg" loading=“lazy” decoding=“async” alt="Checkmark"> In-text citations <img class="information" src="images/svg/Information2.svg" loading=“lazy” decoding=“async” alt="Information">
        <span class="text-analysis-stat-tooltip" id="in-text-citations-tooltip">0 in-text citations (APA or IEEE style)</span>
      </div>
    </div>
  </div>
  <grammarly-editor-plugin config.activation="immediate">
    <div class="text-box" contenteditable="true" role="textbox" data-ph="`+ placeholder + `">` + old_text + `</div>
  </grammarly-editor-plugin>
  <div class="analyze-btns-container">
    <a class="download-analysis-btn">
      <img src="images/svg/Download.svg" loading=“lazy” decoding=“async” alt="Download">Download analysis </a>
    <div id="word-count">Word count: 0</div>
    <a class="analyze-text-btn">Analyze writing</a>
  </div>
</div>`;
                        toolContent.innerHTML = content;
                        document.getElementsByClassName("analyze-text-btn")[0].addEventListener("click", getTextAnalysis);
                        document.getElementsByClassName("analyze-text-btn")[0].addEventListener("click", showStatsOnClick);
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
                            document.execCommand('insertHTML', false, text);
                        });
                        textBox.addEventListener("input", onSelfTextChange);
                        onWindowResize();
                    }

                    function showStatsOnClick() {    
                        let stats = document.getElementsByClassName("text-analysis-container");
                        let textBox = document.getElementsByClassName("text-box")[0];
                        let textBoxContent = textBox.innerText;       
                        if (textBoxContent != "") {
                            stats[0].classList.remove("text-analysis-container-hidden");
                            stats[0].classList.add("text-analysis-container-visible");
                        } 
                    }                             
                    
                    function onSelfTextChange() {
                        if (activeToggleOption == "pentachart") {
                            pentachartSelfText = this.value.toString();
                        }
                        else if (activeToggleOption == "research") {
                            researchSelfText = this.value.toString();
                        }
                        else {
                            presentationSelfText = this.value.toString();;
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
                        let textBoxContent = textBox.innerText;
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
                                    // good readability
                                    let longSentences = response.data.success.longSentences;
                                    let shortSentences = response.data.success.shortSentences;
                                    let longParagraphs = response.data.success.longParagraphs;
                                    let shortParagraphs = response.data.success.shortParagraphs;
                                    let goodReadability = document.getElementById("good-readability");
                                    let goodReadabilityTooltip = document.getElementById("good-readability-tooltip");
                                    let improperSentencesCount = response.data.success.improperSentencesCount;
                                    let improperParagraphsCount = response.data.success.improperParagraphsCount;
                                    for (longSentence of longSentences) {
                                        textBoxContent = textBoxContent.replaceAll(longSentence, '<span class="long-sentence-warning"  data-hover="Warning: this sentence is too long\nA typical academic sentence is 20-35 words, and\nhas a main clause and 1-2 subordinate clauses">' + longSentence + '</span>');
                                    }
                                    for (shortSentence of shortSentences) {
                                        textBoxContent = textBoxContent.replaceAll(shortSentence, '<span class="short-sentence-warning" data-hover="Warning: this sentence is too short\nA typical academic sentence is 20-35 words, and\nhas a main clause and 1-2 subordinate clauses">' + shortSentence + '</span>');
                                    }
                                    for (longParagraphs of longParagraphs) {
                                        textBoxContent = textBoxContent.replaceAll(longParagraph, '<span class="long-paragraph-warning"  data-hover="Warning: this paragraph is too long\nA typical academic paragraph is 3-6 sentences">' + longParagraph + '</span>');
                                    }
                                    for (shortParagraph of shortParagraphs) {
                                        textBoxContent = textBoxContent.replaceAll(shortParagraph, '<span class="short-paragraph-warning" data-hover="Warning: this paragraph is too short\nA typical academic paragraph is 3-6 sentences">' + shortParagraph + '</span>');
                                    }
                                    textBox.innerHTML = textBoxContent;
                                    if (improperSentencesCount > 0 && improperParagraphsCount == 0) {
                                        goodReadability.classList.remove("text-analysis-stat-correct");
                                        goodReadability.classList.add("text-analysis-stat-warning");
                                        goodReadabilityTooltip.classList.remove("text-analysis-stat-tooltip-correct");
                                        goodReadabilityTooltip.classList.add("text-analysis-stat-tooltip-warning");
                                        goodReadability.firstElementChild.src = `images/svg/Alert2.svg`;
                                        goodReadability.firstElementChild.alt = `Alert`;
                                        if (improperSentencesCount == 1) {
                                            goodReadabilityTooltip.innerText = `A sentence is\n too long or too short`;
                                        }
                                        else if (improperSentencesCount > 1) {
                                            goodReadabilityTooltip.innerText = improperSentencesCount + ` sentences are \ntoo long or too short`;
                                        }  
                                    } else if (improperParagraphsCount > 0 && improperSentencesCount == 0) {
                                        goodReadability.classList.remove("text-analysis-stat-correct");
                                        goodReadability.classList.add("text-analysis-stat-warning");
                                        goodReadabilityTooltip.classList.remove("text-analysis-stat-tooltip-correct");
                                        goodReadabilityTooltip.classList.add("text-analysis-stat-tooltip-warning");
                                        goodReadability.firstElementChild.src = `images/svg/Alert2.svg`;
                                        goodReadability.firstElementChild.alt = `Alert`;
                                        if (improperParagraphsCount == 1) {
                                            goodReadabilityTooltip.innerText = `A paragraph is\n too long or too short`;
                                        } else {
                                            goodReadabilityTooltip.innerText = improperParagraphsCount + ` paragraphs are \ntoo long or too short`;
                                        }                               
                                    } else if (improperSentencesCount > 0 && improperParagraphsCount > 0) {
                                        goodReadability.classList.remove("text-analysis-stat-correct");
                                        goodReadability.classList.add("text-analysis-stat-warning");
                                        goodReadabilityTooltip.classList.remove("text-analysis-stat-tooltip-correct");
                                        goodReadabilityTooltip.classList.add("text-analysis-stat-tooltip-warning");
                                        goodReadability.firstElementChild.src = `images/svg/Alert2.svg`;
                                        goodReadability.firstElementChild.alt = `Alert`;
                                        if (improperSentencesCount == 1 && improperParagraphsCount == 1) {
                                            goodReadabilityTooltip.innerText = `1 sentence and 1 paragraph\n too long or too short`;
                                        } else {
                                            goodReadabilityTooltip.innerText = improperSentencesCount + ` sentence(s) and\n` + improperParagraphsCount + ` paragraph(s) too long or too short`;
                                        }
                                    } else {
                                        goodReadability.classList.remove("text-analysis-stat-warning");
                                        goodReadability.classList.add("text-analysis-stat-correct");
                                        goodReadabilityTooltip.classList.remove("text-analysis-stat-tooltip-warning");
                                        goodReadabilityTooltip.classList.add("text-analysis-stat-tooltip-correct");
                                        goodReadability.firstElementChild.src = `images/svg/Checkmark2.svg`;
                                        goodReadability.firstElementChild.alt = `Checkmark`;
                                        goodReadabilityTooltip.innerText = `Correct sentence and \nparagraph length`;
                                    }
                                    // no contractions
                                    let contractions = response.data.success.contractionMatches;
                                    let noContractions = document.getElementById("no-contractions");
                                    let noContractionsTooltip = document.getElementById("no-contractions-tooltip");
                                    let contractionCount = contractions.length;
                                    for (contraction of contractions) {
                                        textBoxContent = textBoxContent.replaceAll(contraction, '<span class="highlighted-error" data-hover="Error: use of\ncontractions">' + contraction + '</span>');
                                    }
                                    textBox.innerHTML = textBoxContent;
                                    if (contractionCount > 0) {
                                        noContractions.classList.remove("text-analysis-stat-correct");
                                        noContractions.classList.add("text-analysis-stat-error")
                                        noContractionsTooltip.classList.remove("text-analysis-stat-tooltip-correct");
                                        noContractionsTooltip.classList.add("text-analysis-stat-tooltip-error");
                                        noContractions.firstElementChild.src = `images/svg/Error.svg`;
                                        noContractions.firstElementChild.alt = `Error`;
                                        if (contractionCount == 1) {
                                            noContractionsTooltip.innerText = contractionCount + ` ocurrence of contractions`;
                                        }
                                        else {
                                            noContractionsTooltip.innerText = contractionCount + ` ocurrences of contractions`;
                                        }
                                    }
                                    else {
                                        textBox.value = textBoxContent; 
                                        noContractions.classList.remove("text-analysis-stat-error");
                                        noContractions.classList.add("text-analysis-stat-correct");
                                        noContractionsTooltip.classList.remove("text-analysis-stat-tooltip-error");
                                        noContractionsTooltip.classList.add("text-analysis-stat-tooltip-correct");
                                        noContractions.firstElementChild.src = `images/svg/Checkmark2.svg`;
                                        noContractions.firstElementChild.alt = `Checkmark`;
                                        noContractionsTooltip.innerText = contractionCount + ` ocurrences of contractions`;
                                    }

                                    // tentative language
                                    let tentatives = response.data.success.tentativeMatches;
                                    let tentativeLanguage = document.getElementById("tentative-language");
                                    let tentativeTooltip = document.getElementById("tentative-language-tooltip");
                                    let tentativeCount = tentatives.length;
                                    for (tentative of tentatives) {
                                        textBoxContent = textBoxContent.replaceAll(tentative, '<span class="highlighted-correct" data-hover="Correct: use of \ntentative expressions">' + tentative + '</span>');
                                    }
                                    textBox.innerHTML = textBoxContent;
                                    if (tentativeCount > 0) {
                                        tentativeLanguage.classList.remove("text-analysis-stat-warning");
                                        tentativeLanguage.classList.add("text-analysis-stat-correct")
                                        tentativeTooltip.classList.remove("text-analysis-stat-tooltip-warning");
                                        tentativeTooltip.classList.add("text-analysis-stat-tooltip-correct");
                                        tentativeLanguage.firstElementChild.src = `images/svg/Checkmark2.svg`;
                                        tentativeLanguage.firstElementChild.alt = `Checkmark`;
                                        if (tentativeCount == 1) {
                                            tentativeTooltip.innerText = tentativeCount + ` ocurrence of \ntentative language`;
                                        }
                                        else {
                                            tentativeTooltip.innerText = tentativeCount + ` ocurrences of \ntentative language`;
                                        }
                                    }
                                    else {
                                        textBox.value = textBoxContent; 
                                        tentativeLanguage.classList.remove("text-analysis-stat-correct");
                                        tentativeLanguage.classList.add("text-analysis-stat-warning");
                                        tentativeTooltip.classList.remove("text-analysis-stat-tooltip-correct");
                                        tentativeTooltip.classList.add("text-analysis-stat-tooltip-warning");
                                        tentativeLanguage.firstElementChild.src = `images/svg/Alert2.svg`;
                                        tentativeLanguage.firstElementChild.alt = `Alert`;
                                        tentativeTooltip.innerText = tentativeCount + ` ocurrences of \ntentative language`;
                                    }
                                    
                                    // no personal pronouns
                                    let pronouns = response.data.success.pronounMatches;
                                    let noPersonalPronouns = document.getElementById("no-personal-style");
                                    let noPersonalPronounsTooltip = document.getElementById("no-personal-style-tooltip");
                                    let pronounCount = pronouns.length;
                                    for (pronoun of pronouns) {
                                        textBoxContent = textBoxContent.replaceAll(pronoun, '<span class="highlighted-error" data-hover="Error: use of \npersonal style">' + pronoun + '</span>');
                                    }
                                    textBox.innerHTML = textBoxContent;
                                    if (pronounCount > 0) {
                                        noPersonalPronouns.classList.remove("text-analysis-stat-correct");
                                        noPersonalPronouns.classList.add("text-analysis-stat-error");
                                        noPersonalPronounsTooltip.classList.remove("text-analysis-stat-tooltip-correct");
                                        noPersonalPronounsTooltip.classList.add("text-analysis-stat-tooltip-error");
                                        noPersonalPronouns.firstElementChild.src = `images/svg/Error.svg`;
                                        noPersonalPronouns.firstElementChild.alt = `Error`;
                                        if (pronounCount == 1) {
                                            noPersonalPronounsTooltip.innerText = pronounCount + ` ocurrence of a personal construction`;
                                        }
                                        else {
                                            noPersonalPronounsTooltip.innerText = pronounCount + ` ocurrences of personal constructions`;
                                        }
                                    }
                                    else {
                                        noPersonalPronouns.classList.remove("text-analysis-stat-error");
                                        noPersonalPronouns.classList.add("text-analysis-stat-correct");
                                        noPersonalPronounsTooltip.classList.remove("text-analysis-stat-tooltip-error");
                                        noPersonalPronounsTooltip.classList.add("text-analysis-stat-tooltip-correct");
                                        noPersonalPronouns.firstElementChild.src = `images/svg/Checkmark2.svg`;
                                        noPersonalPronouns.firstElementChild.alt = `Checkmark`;
                                        noPersonalPronounsTooltip.innerText = pronounCount + ` ocurrences of personal constructions`;
                                    }

                                    // in-text citations
                                    let citations = response.data.success.citationMatches;
                                    let inTextCitations = document.getElementById("in-text-citations");
                                    let inTextCitationsTooltip = document.getElementById("in-text-citations-tooltip");
                                    let citationCount = citations.length;
                                    for (citation of citations) {
                                        textBoxContent = textBoxContent.replaceAll(citation, '<span class="highlighted-correct" data-hover="Correct: use of \nin-text citations">' + citation + '</span>');
                                    }
                                    textBox.innerHTML = textBoxContent;
                                    if (citationCount > 0) {
                                        inTextCitations.classList.remove("text-analysis-stat-warning");
                                        inTextCitations.classList.add("text-analysis-stat-correct");
                                        inTextCitationsTooltip.classList.remove("text-analysis-stat-tooltip-warning");
                                        inTextCitationsTooltip.classList.add("text-analysis-stat-tooltip-correct");
                                        inTextCitations.firstElementChild.src = `images/svg/Checkmark2.svg`;
                                        inTextCitations.firstElementChild.alt = `Checkmark`;
                                        if (citationCount == 1) {
                                            inTextCitationsTooltip.innerText = citationCount + ` in-text citation found \n(APA or IEEE style)`;
                                        }
                                        else {
                                            inTextCitationsTooltip.innerText = citationCount + ` in-text citations found \n(APA or IEEE style)`;
                                        }
                                    }
                                    else {
                                        inTextCitations.classList.remove("text-analysis-stat-correct");
                                        inTextCitations.classList.add("text-analysis-stat-warning");
                                        inTextCitationsTooltip.classList.remove("text-analysis-stat-tooltip-correct");
                                        inTextCitationsTooltip.classList.add("text-analysis-stat-tooltip-warning");
                                        inTextCitations.firstElementChild.src = `images/svg/Alert2.svg`;
                                        inTextCitations.firstElementChild.alt = `Alert`;
                                        inTextCitationsTooltip.innerText = citationCount + ` in-text citations found \n(APA or IEEE style)`;
                                    }

                                    // general analysis (to download)
                                    
                                    // word count
                                    let wordCount = document.getElementById("word-count");
                                    wordCount.innerText = "Word count: " + response.data.success.wordCount;
                                    // no colloquialisms
                                    let colloquialisms = response.data.success.colloquialismMatches;
                                    let noColloquialisms = document.getElementById("no-colloquialisms");
                                    let noColloquialismsTooltip = document.getElementById("no-colloquialisms-tooltip");
                                    let colloquialismCount = colloquialisms.length;
                                    for (colloquialism of colloquialisms) {
                                        textBoxContent = textBoxContent.replaceAll(colloquialism, '<span class="highlighted-error" data-hover="Error: use of \ncolloquial expressions">' + colloquialism + '</span>');
                                    }
                                    textBox.innerHTML = textBoxContent;
                                    if (colloquialismCount > 0) {
                                        noColloquialisms.classList.remove("text-analysis-stat-correct")
                                        noColloquialisms.classList.add("text-analysis-stat-error")
                                        noColloquialismsTooltip.classList.remove("text-analysis-stat-tooltip-correct")
                                        noColloquialismsTooltip.classList.add("text-analysis-stat-tooltip-error")
                                        noColloquialisms.firstElementChild.src = `images/svg/Error.svg`;
                                        noColloquialisms.firstElementChild.alt = `Error`;
                                        if (colloquialismCount == 1) {
                                            noColloquialismsTooltip.innerText = colloquialismCount + ` ocurrence of \na colloquial expression`;
                                        }
                                        else {
                                            noColloquialismsTooltip.innerText = colloquialismCount + ` ocurrences of \ncolloquial expressions`;
                                        }
                                    }
                                    else {
                                        noColloquialisms.classList.remove("text-analysis-stat-error")
                                        noColloquialisms.classList.add("text-analysis-stat-correct")
                                        noColloquialismsTooltip.classList.remove("text-analysis-stat-tooltip-error")
                                        noColloquialismsTooltip.classList.add("text-analysis-stat-tooltip-correct")
                                        noColloquialisms.firstElementChild.src = `images/svg/Checkmark2.svg`;
                                        noColloquialisms.firstElementChild.alt = `Checkmark`;
                                        noColloquialismsTooltip.innerText = colloquialismCount + ` ocurrences of \ncolloquial expressions`;
                                    }
                                    // no phrasal verbs
                                    let phrasalVerbs = response.data.success.phrasalVerbMatches;
                                    let noPhrasalVerbs = document.getElementById("no-phrasal-verbs");
                                    let noPhrasalVerbsTooltip = document.getElementById("no-phrasal-verbs-tooltip");
                                    let phrasalVerbCount = phrasalVerbs.length;
                                    for (phrasalVerb of phrasalVerbs) {
                                        textBoxContent = textBoxContent.replaceAll(phrasalVerb, '<span class="highlighted-error" data-hover="Error: use of \nphrasal verbs">' + phrasalVerb + '</span>');
                                    }
                                    textBox.innerHTML = textBoxContent;
                                    if (phrasalVerbCount > 0) {
                                        noPhrasalVerbs.classList.remove("text-analysis-stat-correct");
                                        noPhrasalVerbs.classList.add("text-analysis-stat-error");
                                        noPhrasalVerbsTooltip.classList.remove("text-analysis-stat-tooltip-correct");
                                        noPhrasalVerbsTooltip.classList.add("text-analysis-stat-tooltip-error");
                                        noPhrasalVerbs.firstElementChild.src = `images/svg/Error.svg`;
                                        noPhrasalVerbs.firstElementChild.alt = `Error`;
                                        if (phrasalVerbCount == 1) {
                                            noPhrasalVerbsTooltip.innerText = phrasalVerbCount + ` ocurrence of \na phrasal verb`;
                                        }
                                        else {
                                            noPhrasalVerbsTooltip.innerText = phrasalVerbCount + ` ocurrences of \nphrasal verbs`;
                                        }
                                    }
                                    else {
                                        noPhrasalVerbs.classList.remove("text-analysis-stat-error");
                                        noPhrasalVerbs.classList.add("text-analysis-stat-correct");
                                        noPhrasalVerbsTooltip.classList.remove("text-analysis-stat-tooltip-error");
                                        noPhrasalVerbsTooltip.classList.add("text-analysis-stat-tooltip-correct");
                                        noPhrasalVerbs.firstElementChild.src = `images/svg/Checkmark2.svg`;
                                        noPhrasalVerbs.firstElementChild.alt = `Checkmark`;
                                        noPhrasalVerbsTooltip.innerText = phrasalVerbCount + ` ocurrences of \nphrasal verbs`;
                                    }
                                    // no informal connectors
                                    let informalConnectors = response.data.success.informalConnectorMatches;
                                    let noInformalConnectors = document.getElementById("no-informal-connectors");
                                    let noInformalConnectorsTooltip = document.getElementById("no-informal-connectors-tooltip");
                                    let informalConnectorCount = informalConnectors.length;
                                    for (informalConnector of informalConnectors) {
                                        textBoxContent = textBoxContent.replaceAll(informalConnector, '<span class="highlighted-error" data-hover="Error: use of \ninformal connectors">' + informalConnector + '</span>');
                                    }
                                    textBox.innerHTML = textBoxContent;
                                    if (informalConnectorCount > 0) {
                                        noInformalConnectors.classList.remove("text-analysis-stat-correct");
                                        noInformalConnectors.classList.add("text-analysis-stat-error");
                                        noInformalConnectorsTooltip.classList.remove("text-analysis-stat-tooltip-correct");
                                        noInformalConnectorsTooltip.classList.add("text-analysis-stat-tooltip-error");
                                        noInformalConnectors.firstElementChild.src = `images/svg/Error.svg`;
                                        noInformalConnectors.firstElementChild.alt = `Error`;
                                        if (informalConnectorCount == 1) {
                                            noInformalConnectorsTooltip.innerText = informalConnectorCount + ` ocurrence of \nan informal connector`;
                                        }
                                        else {
                                            noInformalConnectorsTooltip.innerText = informalConnectorCount + ` ocurrences of \ninformal connectors`;
                                        }
                                    }
                                    else {
                                        noInformalConnectors.classList.remove("text-analysis-stat-error");
                                        noInformalConnectors.classList.add("text-analysis-stat-correct");
                                        noInformalConnectorsTooltip.classList.remove("text-analysis-stat-tooltip-error");
                                        noInformalConnectorsTooltip.classList.add("text-analysis-stat-tooltip-correct");
                                        noInformalConnectors.firstElementChild.src = `images/svg/Checkmark2.svg`;
                                        noInformalConnectors.firstElementChild.alt = `Checkmark`;
                                        noInformalConnectorsTooltip.innerText = informalConnectorCount + ` ocurrences of \ninformal connectors`;
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
