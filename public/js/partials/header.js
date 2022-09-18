if (document.readyState == "loading") {
     /* If content not loaded, call function when finished loading */
    document.addEventListener("DOMContentLoaded", headerAction);
} else {
    /* If content loaded, call function */
    headerAction();
}

function headerAction() {
    /* When scroll is detected, if Y offset is more than 50,
    darken header background; else, remove dark style */
    window.addEventListener("scroll", () => {
        if (window.scrollY > 50) {
            document.getElementById("header").classList.add("header-on-scroll")
        }
        else {
            document.getElementById("header").classList.remove("header-on-scroll")
        }
    });
    let btn = document.getElementsByClassName("auth")[0].firstElementChild;
    if (btn.innerText == "Logout") {
        btn.addEventListener("click", () => {
            axios({
                method: "post",
                url: "/logout",
                data: {},
                headers: { "Content-Type": "application/json" },
            }).then(function (response) {
                let auth = document.getElementsByClassName("auth")[0];
                auth.innerHTML = `<a href="/login">Sign in</a>`;
            }).catch(function (err) {
                // err
            })
        })
    }
}