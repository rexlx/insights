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
        if (!this.user.services) {
            this.user.services = [];
        }
        this.user.services.push(service);
    }
    removeService(service) {
        if (this.user.services) {
            this.user.services = this.user.services.filter((x) => x !== service);
        }
        // this.user.services = this.servers;
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
            this.errors.push(`Error saving history: ${err}`);
        }
        this.results = [];
        // this.resultWorkers.pop();
    }
    async saveResultsToCSV(includeHisotry) {
        let rightFreakinNow = new Date();
        const filename = `results-${rightFreakinNow.getFullYear()}-${rightFreakinNow.getMonth() + 1}-${rightFreakinNow.getDate()}.csv`;
        let csvContent = "data:text/csv;charset=utf-8,";
        let header = `server-id,local-id,value,from,matched,info\n`;
        csvContent += header;
        let data = this.results;
        if (includeHisotry) {
            data.push(...this.resultHistory);
        }
        data.forEach((result) => {
            if (result.info.includes(",")) {
                result.info = result.info.replaceAll(",", " - ");
            }
            let row = `${result.link},${result.id},${result.value},${result.from},${result.matched},${result.info}\n`;
            csvContent += row;
        });
        let encodedUri = encodeURI(csvContent);
        let link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
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