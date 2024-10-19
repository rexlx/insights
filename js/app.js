export class Application {
    constructor(apiUrl, apiKey) {
        this.user = {
            "email": "",
            "key": "",
            "admin": false
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
        this.servers = [
            {
                "kind": "misp",
                "type": ["md5", "sha1", "sha256", "sha512", "ipv4", "ipv6", "email", "url", "domain", "filepath", "filename"],
            },
            {
                "kind": "virustotal",
                "type": ["md5", "sha1", "sha256", "sha512", "ipv4", "ipv6", "email", "url", "domain", "filepath", "filename"],
                "routeMap": [{
                    "type": "md5",
                    "route": "file"
                }, {
                    "type": "sha1",
                    "route": "file"
                }, {
                    "type": "sha256",
                    "route": "file"
                }, {
                    "type": "sha512",
                    "route": "file"
                }, {
                    "type": "ipv4",
                    "route": "ip"
                }, {
                    "type": "ipv6",
                    "route": "ip"
                }, {
                    "type": "email",
                    "route": "email"
                }, {
                    "type": "url",
                    "route": "url"
                }, {
                    "type": "domain",
                    "route": "domains"
                }, {
                    "type": "filepath",
                    "route": "file"
                }, {
                    "type": "filename",
                    "route": "file"
                }]
            }
        ];
        this.sampleData = `
        `
    }
    setUserData(email, key) {
        this.user.email = email;
        this.user.key = key;
        chrome.storage.local.set({ "user": this.user }, () => {
            console.log("User data saved");
        });
    }
    async fetchMatches(to, matches, type) {
        const proxyRequest = {
            "to": to,
            "value": matches,
            "type": type,
        }
        let response = await fetch(this.apiUrl, {
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
        const proxyRequest = {
            "to": to,
            "value": match,
            "type": type,
            "route": route
        }
        console.log("got message", proxyRequest);
        let response = await fetch(this.apiUrl, {
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
}