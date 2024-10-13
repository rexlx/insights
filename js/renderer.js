import { Application } from "./app.js";
import { Contextualizer } from "./parser.js";
const apiUrl = "http://localhost:8080/pipe";
const apiKey = "1234567890";
let application = new Application(apiUrl, apiKey);
let contextualizer = new Contextualizer();

const matchBox = document.getElementById("matchBox");
const userSearch = document.getElementById("userSearch");
const searchButton = document.getElementById("searchButton");
// const menuLinks = document.querySelectorAll('.menu-list a');

async function checkErrors() {
    if (application.errors.length > 0) {
        for (let error of application.errors) {
            matchBox.innerHTML += `<p class="has-text-warning">${error}</p>`;
        }
    }
}


setInterval(() => {
    checkErrors();
    try {
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
                    <p class="has-text-white">link: <span class="has-text-white">${result.link}</span></p>
                    <p class="has-text-white">threat_level_id: <span class="has-text-white">${result.threat_level_id}</span></p>
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

async function handleMatches(kind, matchPair) {
    application.resultWorkers.push(1);
    for (let match of matchPair.matches) {
        try {
            let result = await application.fetchMatch(kind, match, matchPair.type);
            application.results.push(result);
        } catch (error) {
            application.errors.push(error);
        }
    }
    application.resultWorkers.pop();
}

// menuLinks.forEach(link => {
//     link.addEventListener("click", () => {
//         seatActiveLink(link);
//     });
// });

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
                handleMatches(svr.kind, matchPair);
            }
        }
    }
}
);

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