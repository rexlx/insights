import { Application } from "./app.js";
import { Contextualizer } from "./parser.js";
const apiUrl = "http://localhost:8081/";
let application = new Application(apiUrl, "none");
// application.init();
let contextualizer = new Contextualizer();

const matchBox = document.getElementById("matchBox");
const mainSection = document.getElementById("mainSection");
const userSearch = document.getElementById("userSearch");
const searchButton = document.getElementById("searchButton");
const loginScreen = document.getElementById("loginScreen");
const loginButton = document.getElementById("loginButton");
const userEmail = document.getElementById("userEmail");
const userKey = document.getElementById("userKey");
const menuProfile = document.getElementById("menuProfile");
const editUserEmail = document.getElementById("editUserEmail");
const editUserKey = document.getElementById("editUserKey");
const profileView = document.getElementById("profileView");
const updateUserButton = document.getElementById("updateUserButton");
const serviceView = document.getElementById("servicesView");
const menuServices = document.getElementById("menuServices");
const historyButton = document.getElementById("historyButton");
const errorBox = document.getElementById("errors");
// const downloadResultsButton = document.getElementById("downloadResultsButton");

loginScreen.style.display = "none";
mainSection.style.display = "block";
profileView.style.display = "none";
serviceView.style.display = "none";

function checkUser() {
    matchBox.innerHTML = `<p class="has-text-info">logged in as ${application.user.email}</p>`;
    if (application.user.key === "") {
        loginScreen.style.display = "block";
        mainSection.style.display = "none";
        profileView.style.display = "none";
        serviceView.style.display = "none";
    } else {
        loginScreen.style.display = "none";
        mainSection.style.display = "block";
        profileView.style.display = "none";
        serviceView.style.display = "none";
    }
}

async function checkErrors() {
    errorBox.innerHTML = "";
    if (application.errors.length > 0) {
        const errors = removeDupsWithSet(application.errors);
        for (let error of errors) {
            errorBox.innerHTML += `<p class="has-text-warning">${error}</p>`;
        }
    }
}

setInterval(() => {
    checkErrors();
    try {
        if (application.user.email === "" && application.user.key === "") {
            application.fetchUser();
        } else {
            application.getServices();
            // application.fetchHistory();
        }
        if (application.results.length > 0) {
            matchBox.innerHTML = "";
            for (let result of application.results) {
                const uniq = `details-${result.link}`
                matchBox.innerHTML += `<article class="message is-dark">
                <div class="message-header ${result.background}">
                    <p>${result.from}</p>
                    <button class="button is-link is-outlined view-button" id="${uniq}">view</button>
                    </div>
                    <div class="message-body has-background-dark-ter">
                    <p class="has-text-white">match: <span class="has-text-white">${result.value}</span></p>
                    <p class="has-text-white">id: <span class="has-text-white">${result.id}</span></p>
                    <p class="has-text-white">attr_count: <span class="has-text-white">${result.attr_count}</span></p>
                    <p class="has-text-white">threat_level_id: <span class="has-text-white">${result.threat_level_id}</span></p>
                    <p class="has-text-white">info: <span class="has-text-white">${result.info}</span></p>
                    </div>
                    </article>`;
                if (uniq === "details-undefined") {
                    const btn = document.getElementById(uniq);
                    btn.disabled = true;
                }

                // const thisLink = result.link;
            }
            matchBox.innerHTML += `<button class="button is-primary" id="downloadResultsButton">download</button>`;
            const buttons = document.querySelectorAll('.view-button');
            buttons.forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const bid = e.target.id;
                    const thisLink = bid.replace("details-", "");
                    try {
                        await application.fetchDetails(thisLink);
                        const newTab = window.open();
                        newTab.document.body.innerHTML = `<pre>${JSON.stringify(application.focus, null, 2)}</pre>`;
                    } catch (error) {
                        application.errors.push(error);
                    }

                });
            });
            const downloadResultsButton = document.getElementById("downloadResultsButton");
            downloadResultsButton.addEventListener("click", () => {
                // const blob = new Blob([JSON.stringify(application.results, null, 2)], { type: "application/json" });
                // const url = URL.createObjectURL(true);
                // const a = document.createElement('a');
                // a.href = url;
                // a.download = 'results.json';
                // a.click();
                // URL.revokeObjectURL(url);
                application.saveResultsToCSV(true);
            });
            if (application.resultWorkers.length === 0) {
                application.setHistory();
            }
        }
    } catch (error) {
        console.log(error);
    }
}, 3300);

function getRouteByType(routeMap, type) {
    for (let route of routeMap) {
        if (route.type === type) {
            return route.route;
        }
    }
    return "";
}


// probably the route will depend on the in kind of search, shohld enhance 
async function handleMatches(kind, matchPair, route) {
    application.resultWorkers.push(1);
    for (let match of matchPair.matches) {
        try {
            let result = await application.fetchMatch(kind, match, matchPair.type, route);
            application.results.push(result);
        } catch (error) {
            application.errors.push(error);
        }
    }
    application.resultWorkers.pop();
}


menuProfile.addEventListener("click", (e) => {
    e.preventDefault();
    editUserEmail.value = application.user.email;
    editUserKey.value = application.user.key;
    loginScreen.style.display = "none";
    mainSection.style.display = "none";
    serviceView.style.display = "none";
    profileView.style.display = "block";
    updateUserButton.addEventListener("click", () => {
        application.setUserData(editUserEmail.value, editUserKey.value);
        checkUser();
    });
});

historyButton.addEventListener("click", (e) => {
    e.preventDefault();
    loginScreen.style.display = "none";
    mainSection.style.display = "block";
    profileView.style.display = "none";
    serviceView.style.display = "none";
    matchBox.innerHTML = `<p class="has-text-info">application history is ${application.resultHistory.length}</p>`;
    // if (application.history === undefined) {
    //     application.history = [];
    //     checkUser();
    // }
    for (let result of application.resultHistory) {
        const uniq = `details-${result.link}`
        // application.errors.push(uniq);
        matchBox.innerHTML += `<article class="message is-dark">
        <div class="message-header ${result.background}">
            <p>${result.from}</p>
            <button class="button is-link is-outlined view-button" id="${uniq}">view</button>
            </div>
            <div class="message-body has-background-dark-ter">
            <p class="has-text-white">match: <span class="has-text-white">${result.value}</span></p>
            <p class="has-text-white">id: <span class="has-text-white">${result.id}</span></p>
            <p class="has-text-white">attr_count: <span class="has-text-white">${result.attr_count}</span></p>
            <p class="has-text-white">threat_level_id: <span class="has-text-white">${result.threat_level_id}</span></p>
            <p class="has-text-white">info: <span class="has-text-white">${result.info}</span></p>
            </div>
            </article>`;
        if (uniq === "details-undefined") {
            const btn = document.getElementById(uniq);
            btn.disabled = true;
        }
    }
    matchBox.innerHTML += `<button class="button is-primary" id="downloadResultsButton">download</button>`;
    const buttons = document.querySelectorAll('.view-button');
            buttons.forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const bid = e.target.id;
                    const thisLink = bid.replace("details-", "");
                    try {
                        await application.fetchDetails(thisLink);
                        const newTab = window.open();
                        newTab.document.body.innerHTML = `<pre>${JSON.stringify(application.focus, null, 2)}</pre>`;
                    } catch (error) {
                        application.errors.push(error);
                    }

                });
            });
            const downloadResultsButton = document.getElementById("downloadResultsButton");
            downloadResultsButton.addEventListener("click", () => {
                // const blob = new Blob([JSON.stringify(application.results, null, 2)], { type: "application/json" });
                // const url = URL.createObjectURL(true);
                // const a = document.createElement('a');
                // a.href = url;
                // a.download = 'results.json';
                // a.click();
                // URL.revokeObjectURL(url);
                application.saveResultsToCSV(true);
            });
});

searchButton.addEventListener("click", async () => {
    matchBox.innerHTML = "<p>parsed text...searching...</p>";
    matchBox.innerHTML += `<progress class="progress is-primary" max="100"></progress>`
    const allMatches = [];
    for (let key in contextualizer.expressions) {
        let matches = contextualizer.getMatches(userSearch.value, contextualizer.expressions[key]);
        matches = removeDupsWithSet(matches);
        let matchPair = {
            "type": key,
            "matches": matches
        }
        allMatches.push(matchPair);
    }

    for (let svr of application.user.services) {
        for (let matchPair of allMatches) {
            if (svr.type.includes(matchPair.type)) {
                if (svr.route_map) {
                    svr.route = getRouteByType(svr.route_map, matchPair.type);
                } else {
                    svr.route = "";
                }
                handleMatches(svr.kind, matchPair, svr.route);
            }
        }
    }
}
);

loginButton.addEventListener("click", () => {
    application.user.email = userEmail.value;
    application.user.key = userKey.value
    chrome.storage.local.set({ "user": application.user }, () => {
        console.log("user saved");
    });
    checkUser();
});

menuServices.addEventListener("click", (e) => {
    e.preventDefault();
    // editUserEmail.value = application.user.email;
    // editUserKey.value = application.user.key;
    loginScreen.style.display = "none";
    mainSection.style.display = "none";
    profileView.style.display = "none";
    serviceView.style.display = "block";


    // Insert cards into the card list
    const cardList = document.getElementById('cardList');
    application.servers.forEach(data => {
        // cardList.innerHTML += application.user.services.length;
        // cardList.innerHTML = "";
        data.checked = false;
        try {
            application.user.services.forEach(s => {
                if (s.kind === data.kind) {
                    data.checked = true;
                }
            });
        } catch (error) {
            console.log(error);
        }
        const cardElement = createServiceCard(data);
        cardList.appendChild(cardElement);
    });
});

function createServiceCard(service) {
    const card = document.createElement('div');
    card.className = 'card';
    card.classList.add('has-background-dark');
    // let checkedValue = checked ? "checked" : "";
    card.innerHTML = `
        <header class="card-header">
            <div class="containerCheckBox">
                <p class="card-header-title">${service.kind}</p>
                <button class="button add-button is-warning is-outlined">${service.checked ? 'Remove' : 'Add'}</button> 
            </div>
        </header>
        <div class="card-content has-background-black">
            <div class="content has-text-link-light">
                <p>${service.type}</p>
            </div>
        </div>
    `;
    const addButton = card.querySelector('.add-button');
    addButton.textContent = service.checked ? 'Remove' : 'Add';
    addButton.addEventListener('click', () => {
        if (service.checked) {
            application.removeService(service);
            application.updateUser(application.user);
            service.checked = false;
        } else {
            application.addService(service);
            application.updateUser(application.user);
            service.checked = true;
        }
        addButton.textContent = service.checked ? 'Remove' : 'Add';
    });

    return card;
}

function removeDupsWithSet(arr) {
    let unique = new Set(arr);
    return [...unique];
}


