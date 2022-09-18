if (document.readyState == "loading") {
    /* If content not loaded, call function when finished loading */
    document.addEventListener("DOMContentLoaded", aboutReady);
} else {
     /* If content loaded, call function */
     aboutReady();
}

function aboutReady() {
    let questions = document.getElementsByClassName("about-question");
    let questionsArray = [].slice.call(questions);
    questions[0].style.borderTopLeftRadius = "10px";
    questions[0].style.borderTopRightRadius = "10px";
    questionsArray.at(-1).style.borderBottomLeftRadius = "10px";
    questionsArray.at(-1).style.borderBottomRightRadius = "10px";
    for (let question of questions) {
        question.addEventListener("click", toggleQuestion);
    }
    window.addEventListener("resize", aboutOnResize)
}

function toggleQuestion() {
    let answers = document.getElementsByClassName("about-answer");
    for (let answer of answers) {
        if (answer == this.nextElementSibling) {
            /* for the answer of the clicked question */
            if (answer.style.maxHeight && answer.style.maxHeight != "0px") {
                /* if answer was expanded, collapse it (and rotate icon to original position) */
                answer.classList.remove("about-answer-active");
                this.firstElementChild.firstElementChild.nextElementSibling.firstElementChild.style.transform = "rotate(0deg)";
                answer.style.padding = null;
                answer.style.maxHeight = null;
            }
            else {
                /* if answer was collapsed, expand it (and rotate icon) */
                this.firstElementChild.firstElementChild.nextElementSibling.firstElementChild.style.transform = "rotate(180deg)";
                answer.classList.add("about-answer-active");
                answer.style.padding = "20px";
                answer.style.maxHeight = answer.scrollHeight + "px";
            }
        }
        else {
           /* for the rest of the answers, collapse/keep collapsed (and rotate icon if the question was active) */
           if ((answer.classList.contains("about-answer-active"))) {
               answer.previousElementSibling.firstElementChild.firstElementChild.nextElementSibling.firstElementChild.style.transform = "rotate(0deg)";
               answer.classList.remove("about-answer-active");
           }
            answer.style.paddingTop = "0px";
            answer.style.paddingBottom = "0px";
            answer.style.maxHeight = "0px";
        }
    }
}

function aboutOnResize() {
    /* update max height */
    let answers = document.getElementsByClassName("about-answer");
    for (let answer of answers) {
        if (answer.classList.contains("about-answer-active")) {
            answer.style.maxHeight = answer.scrollHeight + "px";
        }
    }
}