class Application {
    constructor(apiUrl, apiKey) {
        this.apiUrl = apiUrl;
        this.apiKey = apiKey;
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
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify(proxyRequest)
        });
        let data = await response.json();
        return data;
    }
    async fetchMatch(to, match, type) {
        const proxyRequest = {
            "to": to,
            "value": match,
            "type": type,
        }
        let response = await fetch(this.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify(proxyRequest)
        });
        let data = await response.json();
        return data;
    }
}