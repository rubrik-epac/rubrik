if (document.readyState == "loading") {
    /* If content not loaded, call function when finished loading */
    document.addEventListener("DOMContentLoaded", toggleReady);
} else {
     /* If content loaded, call function */
    toggleReady();
}

var options; /* pentachart, research, presentation elements */
var toggleBg; /* moving part of toggle */
var activeIdx = 0; /* 0 [pentachart], 1 [research], 2 [presentation] */
var offsets = ["3.6%", "34.7%", "66.4%"]; /* toggleBg's left offset
for active pentachart, research and presentation option, respectively */

function toggleReady() {
    /* Toggle is updated on 3 events:
            refresh (to shorten/lengthen text & update offsets)
            toggle click (to update offsets & update font-family/weight)
            window resize (to shorten/lengthen text & update offsets) */
    options = document.getElementsByClassName("toggle-option");
    toggleBg = document.getElementsByClassName("toggle-bg")[0];
    updateToggleText(); /* handles refresh event */
    updateToggleOffset(); /* handles refresh event */
    for (let option of options) {
        option.addEventListener("click", handleToggleClick); /* handles click event */
    }
    window.addEventListener("resize", handleWindowResize); /* handles resize event */
}

/* Update offset & font-family/weight */
function handleToggleClick() {
    for (let i=0; i<options.length; i++) {
        options[i].firstElementChild.classList.remove("toggle-active");
        if (options[i] == this) {
            activeIdx = i;
        }
    }
    this.firstElementChild.classList.add("toggle-active"); /* bolder font */
    updateToggleOffset();
}

/* Shorten/lengthen text & update offset */
function handleWindowResize() {
    updateToggleText();
    updateToggleOffset();
}

/* Update toggleBg's offset */
/* Suggestion to improve toggle:
    On toggle update event (resize, click, etc.):
        Calculate left offset of active option (e.g. middle option -> left: 34%)
        Then match toggleBg's left offset to that of the active option.
        Match toggleBg's width too to that of the active option (if width varies)
*/
function updateToggleOffset() {
    if (window.innerWidth <= 400) {
        offsets = ["2.4%", "33.5%", "64.7%"];
    }
    else if (window.innerWidth <= 750) {
        offsets = ["3.1%", "34.1%", "66.1%"];
    }
    else if (window.innerWidth <= 1360) {
        offsets = [
            /*0.00166 =(ish) (3.4% - 3.1%) / (1360px - 1180px)*/
            String(3.4 - (1360 - window.innerWidth) * 0.00166) + "%",
            /*0.00166 =(ish) (34.7% - 34.4%) / (1360px - 1180px)*/
            String(34.7 - (1360 - window.innerWidth) * 0.00166) + "%",
            /*0.00166 =(ish) (66.4% - 66.1%) / (1360px - 1180px)*/
            String(66.4 - (1360 - window.innerWidth) * 0.00166) + "%",
        ]
    }
    else {
        offsets = ["3.6%", "34.7%", "66.4%"];
    }
    toggleBg.style.left = offsets[activeIdx];
}

/* Shorten text for mobile devices, lengthen it for desktop devices */
/* Suggestion to improve toggle:
    Don't update with hardcoded strings.
    E.g. shorten first word (if more than one) to initial + period
        Research Proposal -> R. Proposal
    E.g. substitute word for its abbreviation (with help of library)
    -> Allows for toggle option updating from the server/admin dashboard
       without requiring frontend updating
 */
function updateToggleText() {
    if (window.innerWidth <=400) {
        options[1].firstElementChild.innerHTML = "Proposal<span>Quiz</span>";
        options[2].firstElementChild.innerHTML = "Presentation";
    }
    else {
        options[1].firstElementChild.innerHTML = "R. Proposal<span>Quiz</span>";
        options[2].firstElementChild.innerHTML = "O. Presentation";
    }
}