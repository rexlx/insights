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
            for (let result of application.results) {
                matchBox.innerHTML += `<p class="has-text-link-light">match: ${result.value}</p><p class="has-text-link-light">id: ${result.id}</p> <p class="has-text-link-light">attr_count: ${result.attr_count}</p> <p class="has-text-link-light">link: ${result.link}</p> <p class="has-text-link-light">threat_level_id: ${result.threat_level_id}</p>`;
            }
            application.results = [];
        }
    } catch (error) {
        console.log(error); 
    }
}, 6000);

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
    }
    
    for (let matchPair of allMatches) {
        for (let match of matchPair.matches) {
            try {
                let res = await application.fetchMatch("misp", match, matchPair.type);
                application.results.push(res);
            } catch (error) {
                application.errors.push(error);
                // continue;
            }
        }
    }
    // handleMatchBox();
}
);



