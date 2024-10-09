import { Application } from "./app.js";
const apiUrl = "http://localhost:8080/pipe";
const apiKey = "1234567890";
let application = new Application(apiUrl, apiKey);

const matchBox = document.getElementById("matchBox");

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