export class Application {
    constructor(apiUrl, apiKey) {
        this.user = {
        };
        chrome.storage.local.get(["user", "apiUrl"], (result) => {
            if (result.apiUrl) {
                this.apiUrl = result.apiUrl;
            } else {
                this.errors.push("No API URL found in storage.");
                this.apiUrl = "http://localhost:8081/";
            }
            if (result.user) {
                let x = result.user;
                this.setUserData(x.email, x.key, this.apiUrl);
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
        this.focus = { "message": "this data wasn't ready or something truly unexpected happened" };
        this.initialized = false;
    }
    setUserData(email, key, url) {
        this.user.email = email;
        this.user.key = key;
        this.apiUrl = url;
        chrome.storage.local.set({ "user": this.user, "apiUrl": url }, () => {
            console.log("User data saved", url);
        });
        // chrome.storage.local.set({ "apiUrl": this.apiUrl }, () => {
        //     console.log("API URL saved");
        // });
    }
    addService(service) {
        if (!this.user.services) {
            this.user.services = [];
        }
        this.user.services.push(service);
        this.updateUser(this.user);
    }
    removeService(service) {
        if (this.user.services) {
            let tmp = [];
            this.user.services.forEach((s) => {
                if (s.kind !== service.kind) {
                    tmp.push(s);
                }
            });
            this.user.services = tmp;
            this.updateUser(this.user);
        }
        // this.user.services = this.servers;
    }
    async sendLog(message) {
        if (!this.apiUrl) {
            this.errors.push("API URL is not set. Cannot send log.");
            return;
        }
        if (!this.user || !this.user.email) {
            this.errors.push("User email is not set. Cannot send log.");
            return;
        }

        const thisURL = this.apiUrl + `logger`;
        const logData = {
            username: this.user.email,
            message: message
        };

        try {
            if (logData.message === "") {
                this.errors.push("Log message is empty. Cannot send log.");
                return;
            }
            const response = await fetch(thisURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `${this.user.email}:${this.user.key}`
                },
                body: JSON.stringify(logData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! Status: ${response.status} - ${errorText}`);
            }
        } catch (error) {
            this.errors.push(`Error sending log: ${error.message}`);
        }
    }
    async uploadFile(file) {
        const thisURL = this.apiUrl + `upload`;
        const chunkSize = 1024 * 1024; // 1MB
        let currentChunk = 0;

        const uploadChunk = async () => {
            const start = currentChunk * chunkSize;
            const end = Math.min(start + chunkSize, file.size);
            const chunk = file.slice(start, end);
            const progress = Math.ceil((end / file.size) * 100);
            let progressBar = `<progress class="progress" value="${progress}" max="100"></progress>`;
            try {
                const response = await fetch(thisURL, {
                    method: 'POST',
                    headers: {
                        // 'Content-Type': 'application/json', // Remove if sending binary data
                        'Content-Range': `bytes ${start}-${end - 1}/${file.size}`,
                        'X-filename': file.name,
                        'X-last-chunk': currentChunk === Math.ceil(file.size / chunkSize) - 1,
                        'Authorization': `${this.user.email}:${this.user.key}`
                    },
                    body: chunk
                });

                if (!response.ok) {
                    console.error('Error uploading chunk:', response.status);
                    this.sendLog(`Error uploading chunk: ${response.status}`);
                } else {
                    currentChunk++;
                    if (currentChunk < Math.ceil(file.size / chunkSize)) {
                        this.errors = [];
                        this.errors.push(progressBar);
                        uploadChunk(); // Recursive call for next chunk
                    } else {
                        let progressBar = `<p class="has-text-info">uploaded ${file.name}</p>`;
                        this.errors = [];
                        this.errors.push(progressBar);
                        console.log('File uploaded successfully!');
                        const data = await response.json();
                        if (data && data.id) {
                            let newResult = {
                                "background": "has-background-success",
                                "from": "uploader service",
                                "id": data.id,
                                "value": file.name,
                                "link": "none",
                                "attr_count": 0,
                                "threat_level_id": 0,
                                "info": `${data.status} uploaded! the end service may still be processing the file.`
                            }
                            this.results.push(newResult);
                        }
                    }
                }

            } catch (error) {
                console.error('Error uploading chunk:', error);
                this.sendLog(`Error uploading chunk: ${error.message}`);
            }
        };

        uploadChunk(); // Start the upload
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
    }
    async fetchDetails(id) {
        if (!id) {
            this.errors.push("No ID provided for fetching details.");
            return;
        }
        let thisURL = this.apiUrl + `events/${id}`
        let response = await fetch(thisURL, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `${this.user.email}:${this.user.key}`
            }
        });
        if (!response.ok) {
            this.errors.push(`Error fetching details for ID ${id}: ${response.statusText}`);
            return;
        }
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
            "username": this.user.email,
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
        if (this.resultHistory.length > 50) {
            let num2Rm = this.resultHistory.length - 50;
            this.resultHistory.splice(0, num2Rm);
        }
        this.resultHistory.push(data);
        return data;
    }
    async getServices() {
        let thisURL = this.apiUrl + `getservices`
        try {
            let response = await fetch(thisURL, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `${this.user.email}:${this.user.key}`
                }
            });
            if (!response.ok) {
                // this.errors.push("Error fetching services: " + response.statusText);
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            let data = await response.json();

            if (!Array.isArray(data)) {
                // this.errors.push("Error fetching services: " + JSON.stringify(data));
                throw new Error("Error fetching services: " + JSON.stringify(data));
            }

            this.servers = data.map(sanitizeService);
        } catch (err) {
            this.errors.push("Error fetching services: " + err);
        }
    }
    setHistory() {
        if (this.resultHistory.length === 0) {
            return;
        }
        if (this.resultHistory.length > 50) {
            let num2Rm = this.resultHistory.length - 50;
            this.resultHistory.splice(0, num2Rm);
        }
        try {
            chrome.storage.local.set({ "history": this.resultHistory }, () => {
                console.log("History saved");
            });
        } catch (err) {
            this.errors.push(`Error saving history: ${err}`);
        }
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
                if (result && result.history) {
                    let x = result.history;
                    //   this.errors.push(JSON.stringify(x));
                    this.resultHistory.push(...x);
                } else {
                    this.errors.push("No history found in storage.");
                }
            });
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

function sanitizeService(service) {
    // Ensure service is an object; return a safe default if not
    if (!service || typeof service !== 'object') {
    //   console.warn('Invalid service object; returning safe default');
      return {
        upload_service: false,
        expires: 0,
        secret: "",
        selected: false,
        insecure: false,
        name: "",
        url: "",
        rate_limited: false,
        max_requests: 0,
        refill_rate: 0,
        auth_type: "",
        key: "",
        kind: "",
        type: [],
        route_map: null,
        description: ""
      };
    }
  
    // Sanitize and normalize fields
    return {
      upload_service: Boolean(service.upload_service), // Force boolean
      expires: Number.isInteger(service.expires) ? service.expires : 0, // Safe integer
      secret: String(service.secret || ''), // String or empty
      selected: Boolean(service.selected), // Force boolean
      insecure: Boolean(service.insecure), // Force boolean
      name: String(service.name || '').replace(/[<>&"'`;]/g, ''), // Strip risky chars
      url: String(service.url || '').startsWith('http') ? service.url : '', // Basic URL check
      rate_limited: Boolean(service.rate_limited), // Force boolean
      max_requests: Number.isInteger(service.max_requests) ? service.max_requests : 0,
      refill_rate: Number.isInteger(service.refill_rate) ? service.refill_rate : 0,
      auth_type: String(service.auth_type || ''),
      key: String(service.key || ''),
      kind: String(service.kind || ''),
      type: Array.isArray(service.type) ? service.type.map(String) : [], // Ensure array of strings
      route_map: service.route_map,
      description: String(service.description || '').replace(/[<>&"'`;]/g, '') // Strip risky chars
    }
}