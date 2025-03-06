import { Application } from "./app.js";
import { Contextualizer } from "./parser.js";
const apiUrl = "http://fairlady:8081/";
let application = new Application(apiUrl, "none");
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
const goToButton = document.getElementById("goToButton");
const uploadButton = document.getElementById("uploadButton");
const editServerUrl = document.getElementById("editServerUrl");

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

let previousResults = [];
async function updateUI() {
    checkErrors();
    try {
        if (application.results.length > 0 && JSON.stringify(application.results) !== JSON.stringify(previousResults)) {
            previousResults = [...application.results];
            matchBox.innerHTML = "";
            for (let result of application.results) {
                const uniq = `details-${result.link}`;
                matchBox.innerHTML += `<article class="message is-dark">
                <div class="message-header ${result.background}">
                    <p>${result.from}</p>
                    <button class="button is-link is-outlined view-button" id="${uniq}">view</button>
                </div>
                <div class="message-body has-background-dark-ter">
                    <p class="has-text-white">match: <span class="has-text-white">${result.value}</span></p>
                    <p class="has-text-white">id: <span class="has-text-white">${result.id}</span></p>
                    <p class="has-text-white">server id: <span class="has-text-white">${result.link}</span></p>
                    <p class="has-text-white">attr_count: <span class="has-text-white">${result.attr_count}</span></p>
                    <p class="has-text-white">threat_level_id: <span class="has-text-white">${result.threat_level_id}</span></p>
                    <p class="has-text-white">info: <span class="has-text-white">${result.info}</span></p>
                </div>
                </article>`;
            }
            application.setHistory();
            matchBox.innerHTML += `<button class="button is-primary" id="downloadResultsButton">download</button>`;
            // Add event listeners to the buttons
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
                application.saveResultsToCSV(true);
            });
        }
    } catch (error) {
        console.error('Error in updateUI:', error);
    }
    requestAnimationFrame(updateUI);
}

// Start the update loop
requestAnimationFrame(updateUI);

function getRouteByType(routeMap, type) {
    for (let route of routeMap) {
        if (route.type === type) {
            return route.route;
        }
    }
    return "";
}

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
    editServerUrl.value = application.apiUrl;
    loginScreen.style.display = "none";
    mainSection.style.display = "none";
    serviceView.style.display = "none";
    profileView.style.display = "block";
    updateUserButton.addEventListener("click", () => {
        application.setUserData(editUserEmail.value, editUserKey.value, editServerUrl.value);
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

    for (let result of application.resultHistory) {
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
            <p class="has-text-white">info: <span class="has-text-white">${result.link}</span></p>
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

    const sent = [];
    for (let svr of application.user.services) {
        if (sent.includes(svr.kind)) {
            continue;
        }
        sent.push(svr.kind);
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

menuServices.addEventListener("click", async (e) => {
    e.preventDefault();
    await application.getServices();
    loginScreen.style.display = "none";
    mainSection.style.display = "none";
    profileView.style.display = "none";
    serviceView.style.display = "block";


    const cardList = document.getElementById('cardList');
    application.servers.forEach(data => {
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

    const header = document.createElement('header');
    header.className = 'card-header';

    const containerCheckBox = document.createElement('div');
    containerCheckBox.className = 'containerCheckBox';

    const title = document.createElement('p');
    title.className = 'card-header-title has-text-white';

    // Handle service.kind as an array of strings
    if (Array.isArray(service.kind)) {
        const sanitizedKinds = service.kind
            .filter(kind => typeof kind === 'string') // Filter out non-string elements
            .map(escapeHtml) // Sanitize each string
            .join(', '); // Join the strings with a comma

        title.textContent = sanitizedKinds || 'failed to parse types'; // Use sanitizedKinds or a default message
    } else {
        title.textContent = 'Invalid Kind'; // Handle cases where service.kind is not an array
    }

    const addButton = document.createElement('button');
    addButton.className = 'button add-button is-warning is-outlined';
    addButton.textContent = service.checked ? 'Remove' : 'Add';

    containerCheckBox.appendChild(title);
    containerCheckBox.appendChild(addButton);
    header.appendChild(containerCheckBox);

    const contentDiv = document.createElement('div');
    contentDiv.className = 'card-content has-background-black';

    const content = document.createElement('div');
    content.className = 'content has-text-link-light';
    content.textContent = typeof service.type === 'string' ? escapeHtml(service.type) : 'Invalid Type';

    contentDiv.appendChild(content);

    card.appendChild(header);
    card.appendChild(contentDiv);

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


goToButton.addEventListener("click", async (e) => {
    e.preventDefault();
    let inputDiv = `<div class="field">
    <label class="label">enter id</label>
    <div class="control">
      <input class="input" type="text" placeholder="id" id="goToValue">
      </div>
      <div class="field">
            <div class="control">
                <button class="button is-primary" id="goButton">Go</button>
            </div>
      </div>`;
    matchBox.innerHTML = inputDiv;
    const goButton = document.getElementById("goButton");
    const goToValue = document.getElementById("goToValue");
    goButton.addEventListener("click", async () => {
        try {
            await application.fetchDetails(goToValue.value);
            if (typeof application.focus === 'object' && application.focus !== null) {
                const newBody = document.implementation.createHTMLDocument(goToValue.value);
                const style = newBody.createElement("style");
                style.innerHTML = "body { background-color: #333; color: #fff; }";
                newBody.head.appendChild(style); //append style to head.
                const newTab = window.open();
                const escapedJson = escapeHtml(JSON.stringify(application.focus, null, 2));
                newBody.body.innerHTML = `<pre>${escapedJson}</pre>`;
                newTab.document.head.innerHTML = newBody.document.head.innerHTML;
                newTab.document.body.innerHTML = newBody.body.innerHTML;
            } else {
                throw new Error("bad data from server");
                
            }
        } catch (error) {
            application.errors.push(error);
        }
    });
});

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

uploadButton.addEventListener("click", async (e) => {
    e.preventDefault();
    const fileInput = document.createElement("input");
    fileInput.type = "file";

    fileInput.addEventListener("change", async (e) => {
        const file = fileInput.files[0];

        if (!file) {
            console.error("No file selected.");
            return;
        }
        const newFile = new File([file], makeUnique(file.name), { type: file.type });
        await application.uploadFile(newFile);
    });

    fileInput.click();
});

function makeUnique(filename) {
    const parts = filename.split(".");
    if (parts.length === 1) {
        return `${parts[0]}_${Date.now()}`;
    }
    const ext = parts.pop();
    const name = parts.join(".");
    return `${name}_${Date.now()}.${ext}`;
}

function removeDupsWithSet(arr) {
    let unique = new Set(arr);
    return [...unique];
}
