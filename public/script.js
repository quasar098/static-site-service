const siteTitleElm = document.getElementById('siteTitle');
const adminToolsElm = document.getElementById("admin-tools");
const sitesHostedElm = document.getElementById('sitesHosted');
const uploadFolderElm = document.getElementById('upload-folder');
const uploadDiv = document.getElementById('upload');
const noUploadDiv = document.getElementById('no-upload');
const adminDiv = document.getElementById('adminTool')
const siteIdElm = document.getElementById('site-id')

let siteList = [];
let myIp = "ANON";

async function attemptSignIn() {
    const result = await (fetch("/api/login?" + new URLSearchParams({
        address: myIp
    }), {
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
        const result = await fetch("/api/reset?" + new URLSearchParams({
            address: myIp
        }), {
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

    // my ip
    try {
        const result0 = await fetch("https://ipapi.co/json/");
        const body0 = await result0.json();
        myIp = body0.ip ?? "ANON";
    } catch (e) {}

    // title
    const result = await fetch("/api/title", {method: "GET"});
    const title = await result.json();
    document.title = title.title;
    siteTitleElm.innerText = title.title;

    // get sites
    const result2 = await fetch("/api/get-sites", {method: "GET"});
    const body2 = await result2.json();
    siteList = body2;
    sitesHostedElm.innerText = siteList.length + " site(s) have been hosted here";

    // remove upload site
    const result3 = await fetch("/api/do-restrict-ip?" + new URLSearchParams({
        address: myIp
    }), {
        method: "GET",
    })
    if (result3.status == 200) {
        uploadDiv.parentElement.style.display = "block";
        uploadDiv.parentElement.style.opacity = "1";
        noUploadDiv.style.opacity = "0";
    } else {
        uploadDiv.parentElement.style.display = "none";
        uploadDiv.parentElement.style.opacity = "0";
        noUploadDiv.style.opacity = "1";
    }

}
async function uploadSite() {
    if (!siteIdElm.checkValidity()) {
        alert("Please put in a Site ID (the name of the site)")
        return;
    }
    if (siteList.includes(siteIdElm.value.replaceAll(" ", "-"))) {
        if (!confirm("You are going to overwrite this site. Are you sure?")) {
            return;
        }
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
    fetch("/api/upload?" + new URLSearchParams({
        address: myIp
    }), {
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
    const result = await fetch("/api/delete?" + new URLSearchParams({
        address: myIp
    }), {
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
