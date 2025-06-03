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
            matchBox.innerHTML = ""; // Clear previous content

            for (let result of application.results) {
                const uniq = `details-${result.link}`;

                // Create elements
                const article = document.createElement('article');
                article.className = 'message is-dark';

                const header = document.createElement('div');
                header.className = 'message-header';
                if (typeof result.background === 'string') {
                    header.classList.add(escapeHtml(result.background)); // Sanitize background class
                }

                const fromParagraph = document.createElement('p');
                fromParagraph.textContent = escapeHtml(result.from); // Sanitize

                const viewButton = document.createElement('button');
                viewButton.className = 'button is-link is-outlined view-button';
                viewButton.id = uniq;
                viewButton.textContent = 'view';

                header.appendChild(fromParagraph);
                header.appendChild(viewButton);

                const body = document.createElement('div');
                body.className = 'message-body has-background-dark-ter';

                // Function to create <p> elements with sanitized content
                function addMessageBodyParagraph(text, value) {
                    const paragraph = document.createElement('p');
                    paragraph.className = 'has-text-white';
                    paragraph.innerHTML = `${escapeHtml(text)}: <span class="has-text-white">${escapeHtml(value)}</span>`;
                    body.appendChild(paragraph);
                }

                addMessageBodyParagraph('match', result.value);
                addMessageBodyParagraph('id', result.id);
                addMessageBodyParagraph('server id', result.link);
                addMessageBodyParagraph('attr_count', String(result.attr_count));
                addMessageBodyParagraph('threat_level_id', String(result.threat_level_id));
                addMessageBodyParagraph('info', result.info);

                article.appendChild(header);
                article.appendChild(body);
                matchBox.appendChild(article);

                // Add event listener to the button
                viewButton.addEventListener('click', async (e) => {
                    const bid = e.target.id;
                    const thisLink = bid.replace("details-", "");
                    try {
                            await application.fetchDetails(thisLink);
                            const newTab = window.open();
                            const escapedJson = escapeHtml(JSON.stringify(application.focus, null, 2));
                            newTab.document.body.innerHTML = `<pre>${escapedJson}</pre>`;
                            // console.error("Invalid link:", thisLink);
                    } catch (error) {
                        application.errors.push(error);
                        application.sendLog(error, "error in viewButton click event");
                    }
                });
            }

            // Create download button
            const downloadButton = document.createElement('button');
            downloadButton.className = 'button is-primary';
            downloadButton.id = 'downloadResultsButton';
            downloadButton.textContent = 'download';
            matchBox.appendChild(downloadButton);

            downloadButton.addEventListener("click", () => {
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
        if (isPrivateIP(match)) {
        return;
    }
        try {
            let result = await application.fetchMatch(kind, match, matchPair.type, route);
            application.results.push(result);
        } catch (error) {
            application.errors.push(error);
        }
    }
    application.setHistory()
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
        const uniq = `details-${result.link}`;

        // Create message elements
        const article = document.createElement('article');
        article.className = 'message is-dark';

        const header = document.createElement('div');
        header.className = 'message-header';
        if (typeof result.background === 'string') {  // Sanitize background class
            header.classList.add(escapeHtml(result.background));
        }

        const fromParagraph = document.createElement('p');
        fromParagraph.textContent = escapeHtml(result.from); // Sanitize

        const viewButton = document.createElement('button');
        viewButton.className = 'button is-link is-outlined view-button';
        viewButton.id = uniq;
        viewButton.textContent = 'view';

        header.appendChild(fromParagraph);
        header.appendChild(viewButton);

        const body = document.createElement('div');
        body.className = 'message-body has-background-dark-ter';

        // Function to create and append <p> elements with sanitized content
        function addMessageBodyParagraph(text, value) {
            const paragraph = document.createElement('p');
            paragraph.className = 'has-text-white';
            paragraph.innerHTML = `${escapeHtml(text)}: <span class="has-text-white">${escapeHtml(value)}</span>`;
            body.appendChild(paragraph);
        }

        addMessageBodyParagraph('match', result.value);
        addMessageBodyParagraph('id', result.id);
        addMessageBodyParagraph('attr_count', String(result.attr_count));
        addMessageBodyParagraph('threat_level_id', String(result.threat_level_id));
        addMessageBodyParagraph('info', result.info);
        addMessageBodyParagraph('info', result.link);

        article.appendChild(header);
        article.appendChild(body);
        matchBox.appendChild(article);

        if (uniq === "details-undefined") {
            viewButton.disabled = true;
        }

        viewButton.addEventListener('click', async (e) => {
            const bid = e.target.id;
            const thisLink = bid.replace("details-", "");
            try {
                // Validate thisLink (example - check if it's a valid URL)
                await application.fetchDetails(thisLink);
                const newTab = window.open();
                const escapedJson = escapeHtml(JSON.stringify(application.focus, null, 2));
                newTab.document.body.innerHTML = `<pre>${escapedJson}</pre>`;

            } catch (error) {
                application.errors.push(error);
            }
        });
    }

    // Create download button
    const downloadButton = document.createElement('button');
    downloadButton.className = 'button is-primary';
    downloadButton.id = 'downloadResultsButton';
    downloadButton.textContent = 'download';
    matchBox.appendChild(downloadButton);

    downloadButton.addEventListener("click", () => {
        application.saveResultsToCSV(true);
    });
});

function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (error) {
        return false;
    }
}

searchButton.addEventListener("click", async (event) => {
    event.preventDefault();
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
    title.textContent = typeof service.kind === 'string' ? escapeHtml(service.kind) : 'Invalid Kind'; //Sanitize

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
    if (Array.isArray(service.type)) {
        const sanitizedTypes = service.type
            .filter(type => typeof type === 'string')
            .map(type => escapeHtml(type))
            .join(', ');
        content.textContent = sanitizedTypes || 'failed to parse types';
    } else {
        content.textContent = "Invalid Type";
    }

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

// function escapeHtml(unsafe) {
//     return unsafe
//         .replace(/&/g, "&amp;")
//         .replace(/</g, "&lt;")
//         .replace(/>/g, "&gt;")
//         .replace(/"/g, "&quot;")
//         .replace(/'/g, "&#039;");
// }

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
    application.sendLog(`uploading file ${fileInput.name}`);
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

function isPrivateIP(ip) {
    if (typeof ip !== 'string') {
        return false;
    }
    const parts = ip.split('.');
    if (parts.length !== 4) {
        return false; // Not a valid IPv4 format (e.g. could be IPv6 or invalid)
    }
    // Ensure all parts are numbers and within the 0-255 range
    const nums = parts.map(Number);
    if (nums.some(num => isNaN(num) || num < 0 || num > 255)) {
        return false; // Contains non-numeric parts or parts out of IPv4 range
    }

    const [p1, p2, p3, p4] = nums;

    // Check for 10.0.0.0/8 (10.0.0.0 - 10.255.255.255)
    if (p1 === 10) {
        return true;
    }

    // Check for 172.16.0.0/12 (172.16.0.0 - 172.31.255.255)
    if (p1 === 172 && (p2 >= 16 && p2 <= 31)) {
        return true;
    }

    // Check for 192.168.0.0/16 (192.168.0.0 - 192.168.255.255)
    if (p1 === 192 && p2 === 168) {
        return true;
    }

    // Check for loopback 127.0.0.0/8 (127.0.0.0 - 127.255.255.255)
    if (p1 === 127) {
        return true;
    }

    // Check for APIPA 169.254.0.0/16 (169.254.0.0 - 169.254.255.255)
    if (p1 === 169 && p2 === 254) {
        return true;
    }

    return false;
}