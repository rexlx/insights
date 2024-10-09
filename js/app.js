export class Application {
    constructor(apiUrl, apiKey) {
        this.results = [];
        this.errors = [];
        this.apiUrl = apiUrl;
        this.apiKey = apiKey;
        this.SampleData = `
        This is some random text with an MD5 hash: 
        a1d0c6e83f027327d8461063f4ac58a6. 
        
        It's just hanging out here, 
        waiting to be found. 
        
        Oh, and here's another one: 
        8f14e45fceea167a5a36dedd4bea2543. 
        
        Just a couple of MD5s in the wild. 
        Carry on... nothing to see here. 
        `
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
        this.results.push(data);
    }
    async fetchMatch(to, match, type) {
        const proxyRequest = {
            "to": to,
            "value": match,
            "type": type,
        }
        console.log("got message", proxyRequest);
        let response = await fetch(this.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify(proxyRequest)
        });
        let data = await response.json();
        this.results.push(data);
    }
}