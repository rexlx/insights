export class Application {
    constructor(apiUrl, apiKey) {
        this.user = {
        };
        chrome.storage.local.get(["user"], (result) => {
            if (result.user) {
                let x = result.user;
                this.setUserData(x.email, x.key);
                this.init();
            }
        });
        this.resultWorkers = [];
        this.results = [];
        this.errors = [];
        this.apiUrl = apiUrl;
        this.apiKey = apiKey;
        this.servers = [];
        this.resultHistory = [];
        this.focus = { "id": "none" };
        this.initialized = false;
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
        let thisURL = this.apiUrl + `user`
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
        let thisURL = this.apiUrl + `events/${id}`
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
        let thisURL = this.apiUrl + `updateuser`
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
        let thisURL = this.apiUrl + `/pipe`
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
        this.resultHistory.push(data);
    }
    async fetchMatch(to, match, type, route) {
        let thisURL = this.apiUrl + `pipe`
        const proxyRequest = {
            "to": to,
            "value": match,
            "type": type,
            "route": route
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
        if (this.resultHistory.length > 24) {
            let num2Rm = this.resultHistory.length - 24;
            this.resultHistory.splice(0, num2Rm);
        }
        this.resultHistory.push(data);
        return data;
    }
    async getServices() {
        if (!this.initialized) {
            await this.fetchUser();
            this.initialized = true;
        }
        let thisURL = this.apiUrl + `getservices`
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
    setHistory() {
        if (this.resultHistory.length === 0) {
            this.errors.push("No results to save");
            return;
        }
        if (this.resultHistory.length > 24) {
            let num2Rm = this.resultHistory.length - 24;
            this.resultHistory.splice(0, num2Rm);
        }
        try {
            chrome.storage.local.set({ "history": this.resultHistory }, () => {
                console.log("History saved");
            });
        } catch (err) {
            this.errors.push("Error saving history");
        }
        this.results = [];
        // this.resultWorkers.pop();
    }
    fetchHistory() {
        try {
          chrome.storage.local.get(["history"], (result) => {
            if (result) {
              let x = result.history;
            //   this.errors.push(JSON.stringify(x));
              this.resultHistory.push(...x);
            } else {
              this.errors.push("No history found in storage.");
            }
          }); // Ensure 'this' refers to the class instance
        } catch (err) {
          this.errors.push("Error fetching history: " + err);
        }
      }
      init() {
        this.fetchUser();
        this.fetchHistory();
        this.getServices();
      }
}