export class Application {
    constructor(apiUrl, apiKey) {
        this.user = {
        };
        chrome.storage.local.get(["user"], (result) => {
            if (result.user) {
                let x = result.user;
                this.setUserData(x.email, x.key);
            }
        });
        this.resultWorkers = [];
        this.results = [];
        this.errors = [];
        this.apiUrl = apiUrl;
        this.apiKey = apiKey;
        this.servers = [];
        this.focus = {};
    }
    setUserData(email, key) {
        this.user.email = email;
        this.user.key = key;
        chrome.storage.local.set({ "user": this.user }, () => {
            console.log("User data saved");
        });
    }
    addService(service) {
        this.servers.push(service);
        this.user.services = this.servers;
    }
    removeService(service) {
        this.servers = this.servers.filter(s => s.kind !== service.kind);
        this.user.services = this.servers;
    }
    async fetchUser() {
        let thisURL = this.apiUrl+`user`
        let response = await fetch(thisURL, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `${this.user.email}:${this.user.key}`
            }
        });
        let data = await response.json();
        this.user = data;
        // this.servers = this.user.services;
        // return data;
    }
    async fetchDetails(id) {
        let thisURL = this.apiUrl+`events/${id}`
        let response = await fetch(thisURL, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `${this.user.email}:${this.user.key}`
            }
        });
        let data = await response.json();
        this.focus = data;
    }
    async updateUser(user) {
        let thisURL = this.apiUrl+`updateuser`
        let response = await fetch(thisURL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `${this.user.email}:${this.user.key}`
            },
            body: JSON.stringify(user)
        });
        let data = await response.json();
        this.user = data;
    }
    async fetchMatches(to, matches, type) {
        let thisURL = this.apiUrl+`/pipe`
        const proxyRequest = {
            "to": to,
            "value": matches,
            "type": type,
        }
        let response = await fetch(thisURL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `${this.user.email}:${this.user.key}`
            },
            body: JSON.stringify(proxyRequest)
        });
        let data = await response.json();
        this.results.push(data);
    }
    async fetchMatch(to, match, type, route) {
        let thisURL = this.apiUrl+`pipe`
        const proxyRequest = {
            "to": to,
            "value": match,
            "type": type,
            "route": route
        }
        console.log("got message", proxyRequest);
        let response = await fetch(thisURL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `${this.user.email}:${this.user.key}`
            },
            body: JSON.stringify(proxyRequest)
        });
        let data = await response.json();
        return data;
    }
    async getServices() {
        let thisURL = this.apiUrl+`getservices`
        let response = await fetch(thisURL, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `${this.user.email}:${this.user.key}`
            }
        });
        let data = await response.json();
        this.servers = data;
    }
}