import { Application } from "./app.js";
import { Contextualizer } from "./parser.js";
const apiUrl = "http://localhost:8080/pipe";
const apiKey = "1234567890";
let application = new Application(apiUrl, apiKey);
let contextualizer = new Contextualizer();

const matchBox = document.getElementById("matchBox");
const userSearch = document.getElementById("userSearch");
const searchButton = document.getElementById("searchButton");
// let matches = contextualizer.getMatches(data, contextualizer.expressions.md5);

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
                matchBox.innerHTML += `<p class="has-text-link-light">match: <span class="has-text-primary">${result.value}</span></p>
                <p class="has-text-info-light">id: <span class="has-text-primary">${result.id}</span></p>
                <p class="has-text-info-light">attr_count: <span class="has-text-primary">${result.attr_count}</span></p>
                <p class="has-text-info-light">link: <span class="has-text-primary">${result.link}</span></p>
                <p class="has-text-info-light">threat_level_id: <span class="has-text-primary">${result.threat_level_id}</span></p>`;
            }
            if (application.resultWorkers.length === 0) {
                application.results = [];
            }
        }
    } catch (error) {
        console.log(error); 
    }
}, 6000);

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

searchButton.addEventListener("click", async () => {
    matchBox.innerHTML = "<p>parsed text...searching...</p>";
    matchBox.innerHTML += `<progress class="progress is-primary" max="100"></progress>`
    const allMatches = [];
    for (let key in contextualizer.expressions) {
        let matches = contextualizer.getMatches(userSearch.value, contextualizer.expressions[key]);
        let matchPair = {
            "type": key,
            "matches": matches
        }
        allMatches.push(matchPair);
        // matchBox.innerHTML += `<p class="has-text-info-light">matches for ${key}: <span class="has-text-primary">${matches.length}</span></p>`;
    }
    // matchBox.innerHTML += `<p class="has-text-info-light">total matches: <span class="has-text-primary">${allMatches.length}</span></p>`;
    
    for (let svr of application.servers) {
        for (let matchPair of allMatches) {
            if (svr.type.includes(matchPair.type)) {
                // we may not want to await here if we want to run all the matchers concurrently
                handleMatches(svr.kind, matchPair);
            }
        }
    }
    // handleMatchBox();
}
);



