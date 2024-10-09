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
                matchBox.innerHTML += `<p>${result}</p>`;
            }
        }
    } catch (error) {
        console.log(error); 
    }
}, 6000);

function handleMatchBox() {
    try {
        if (application.results.length > 0) {
            for (let result of application.results) {
                matchBox.innerHTML += `<p>${result}</p>`;
            }
        }
    } catch (error) {
        console.log(error);
    }
}

searchButton.addEventListener("click", async () => {
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
            let response = await application.fetchMatch("misp", match, matchPair.type);
        }
    }
    handleMatchBox();
    console.log("YO", allMatches);
}
);



