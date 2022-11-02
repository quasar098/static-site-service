const siteTitleElm = document.getElementById('siteTitle');
const adminToolsElm = document.getElementById("admin-tools");
const sitesHostedElm = document.getElementById('sitesHosted');
const uploadFolderElm = document.getElementById('upload-folder');
const siteIdElm = document.getElementById('site-id')

async function attemptSignIn() {
    const result = await (fetch("/api/login", {
        headers: {
            'Content-Type': 'application/json'
        },
        method: 'POST',
        body: JSON.stringify({username: usernameBox.value, password: passwordBox.value})
    }));
    if (result.status >= 400 && 600 > result.status) {
        alert("Invalid credentials!");
        return;
    }
    const textResult = await result.text();
    localStorage.setItem("jwt", textResult);
    window.location.reload();
}
function logout() {
    localStorage.removeItem('jwt');
    window.location.reload()
}
async function resetWebsites() {
    if (confirm("Are you sure?")) {
        const result = await fetch("/api/reset", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({token: localStorage.getItem("jwt")})
        })
        const status = result.status;
        if (status != 200) {
            alert(status  == 401 ? 'sign in again' : status)
            if (status == 401) {
                localStorage.removeItem("jwt")
            }
        }
        window.location.reload();
    }
}
async function doOnLoad() {
    if (localStorage.getItem("jwt") != null) {
        adminToolsElm.style.display = "block";
    }
    const result = await fetch("/api/title", {method: "GET"});
    const title = await result.json();
    document.title = title.title;
    siteTitleElm.innerText = title.title;
    const result2 = await fetch("/api/get-sites", {method: "GET"});
    const body2 = await result2.json();
    sitesHostedElm.innerText = body2.length + " site(s) have been hosted here";
}
async function uploadSite() {
    if (!siteIdElm.checkValidity()) {
        alert("Please put in a Site ID (the name of the site)")
        return;
    }

    let form = new FormData();
    let files = uploadFolderElm.files;
    if (files.length == 0) {
        alert("Please upload some files!");
        return;
    }

    for (var i = 0; i < files.length; i++) {
        let file = files[i];
        let path = file.webkitRelativePath;
        path = siteIdElm.value.replaceAll(" ", '-') + path.substring(path.indexOf("/"));
        console.log("Adding to form: " + path)
        form.append(path, file);
    }
    fetch("/api/upload", {
        method: "POST",
        body: form
    })
    alert("Uploading...")
    window.location.reload();
}
async function deleteWebsite() {
    let prompted = prompt("Name of site");
    if (prompted == null) {
        alert("ok boomer");
        return;
    }
    console.log(123);
    const result = await fetch("/api/delete", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            name: prompted,
            token: localStorage.getItem("jwt")
        })
    })
    if (result.status != 200) {
        if (result.status == 403) {
            alert("sign in again")
            localStorage.removeItem("jwt")
        } else {
            alert(result.status)
        }
    }
    window.location.reload();
}
doOnLoad();
