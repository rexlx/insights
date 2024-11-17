import { Application } from "./app.js";
import { Contextualizer } from "./parser.js";
const apiUrl = "http://localhost:8081/";
const apiKey = "1234567890";
let application = new Application(apiUrl, apiKey);
let contextualizer = new Contextualizer();

const matchBox = document.getElementById("matchBox");
const mainSection = document.getElementById("mainSection");
const userSearch = document.getElementById("userSearch");
const searchButton = document.getElementById("searchButton");
const loginScreen = document.getElementById("loginScreen");
const loginButton = document.getElementById("loginButton");
const userEmail = document.getElementById("userEmail");
const userKey = document.getElementById("userKey");
const loginInfo = document.getElementById("loginInfo");
const menuProfile = document.getElementById("menuProfile");
const editUserEmail = document.getElementById("editUserEmail");
const editUserKey = document.getElementById("editUserKey");
const profileView = document.getElementById("profileView");
const updateUserButton = document.getElementById("updateUserButton");
const serviceView = document.getElementById("servicesView");
const menuServices = document.getElementById("menuServices");
// const serviceView =  document.getElementById("servicesView");

loginScreen.style.display = "none";
mainSection.style.display = "block";
profileView.style.display = "none";
serviceView.style.display = "none";

// await application.getServices();
// const menuLinks = document.querySelectorAll('.menu-list a');

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
    if (application.errors.length > 0) {
        const errors = removeDupsWithSet(application.errors);
        for (let error of errors) {
            matchBox.innerHTML += `<p class="has-text-warning">${error}</p>`;
        }
    }
}


setInterval(() => {
    // checkUser();
    checkErrors();
    try {
        if (application.user.email !== "" && application.user.key !== "") {
            application.getServices();
            application.fetchUser();
        }
        if (application.results.length > 0) {
            matchBox.innerHTML = "";
            for (let result of application.results) {
                matchBox.innerHTML += `<article class="message is-dark">
                <div class="message-header ${result.background}">
                    <p>${result.from}</p>
                    <button class="delete" aria-label="delete"></button>
                    </div>
                    <div class="message-body has-background-dark-ter">
                    <p class="has-text-white">match: <span class="has-text-white">${result.value}</span></p>
                    <p class="has-text-white">id: <span class="has-text-white">${result.id}</span></p>
                    <p class="has-text-white">attr_count: <span class="has-text-white">${result.attr_count}</span></p>
                    <p class="has-text-white">threat_level_id: <span class="has-text-white">${result.threat_level_id}</span></p>
                    <p class="has-text-white">link: <span class="has-text-white">${result.link}</span></p>
                    <p class="has-text-white">info: <span class="has-text-white">${result.info}</span></p>
                    </div>
                    </article>`;
            }
            if (application.resultWorkers.length === 0) {
                application.results = [];
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

    for (let svr of application.servers) {
        for (let matchPair of allMatches) {
            if (svr.type.includes(matchPair.type)) {
                if (svr.routeMap) {
                    svr.route = getRouteByType(svr.routeMap, matchPair.type);
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
    // let checkedValue = checked ? "checked" : "";
    card.innerHTML = `
        <header class="card-header">
            <div class="containerCheckBox">
                <p class="card-header-title">${service.kind}</p>
                <button class="button add-button has-background-warning">${service.checked ? 'Remove' : 'Add'}</button> 
            </div>
        </header>
        <div class="card-content">
            <div class="content">
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

// function seatActiveLink(link) {
//     menuLinks.forEach(l => {
//         l.classList.remove("is-active");
//     });
//     link.classList.add("is-active");
// }


