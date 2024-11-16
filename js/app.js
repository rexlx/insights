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
                "kind": "deepfry",
                "type": ["ipv4"],
            },
            {
                "kind": "virustotal",
                "type": ["md5", "sha1", "sha256", "sha512", "ipv4", "ipv6", "email", "url", "domain", "filepath", "filename"],
                "routeMap": [{
                    "type": "md5",
                    "route": "files"
                }, {
                    "type": "sha1",
                    "route": "files"
                }, {
                    "type": "sha256",
                    "route": "files"
                }, {
                    "type": "sha512",
                    "route": "files"
                }, {
                    "type": "ipv4",
                    "route": "ip_addresses"
                }, {
                    "type": "ipv6",
                    "route": "ip_addresses"
                },{
                    "type": "url",
                    "route": "urls"
                }, {
                    "type": "domain",
                    "route": "domains"
                }, {
                    "type": "filepath",
                    "route": "files"
                }, {
                    "type": "filename",
                    "route": "files"
                }]
            }
        ];
    }
    setUserData(email, key) {
        this.user.email = email;
        this.user.key = key;
        chrome.storage.local.set({ "user": this.user }, () => {
            console.log("User data saved");
        });
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
        let thisURL = this.apiUrl+`/pipe`
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
        let thisURL = this.apiUrl+`/services`
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