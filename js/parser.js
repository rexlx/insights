export class Contextualizer {
  constructor() {
    this.expressions = {
        "md5": /([a-fA-F\d]{32})/g,
        "sha1": /([a-fA-F\d]{40})/g,
        "sha256": /([a-fA-F\d]{64})/g,
        "sha512": /([a-fA-F\d]{128})/g,
        "ipv4": /(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/g,
        "ipv6": /([a-fA-F\d]{4}(:[a-fA-F\d]{4}){7})/g,
        "email": /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
        "url": /((https?|ftp):\/\/[^\s/$.?#].[^\s]*)/g,
        "domain": /([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
        "hostname": /([a-zA-Z0-9.-]+)/g,
        "filepath": /([a-zA-Z0-9.-]+\/[a-zA-Z0-9.-]+)/g,
        "filename": /([a-zA-Z0-9.-]+)\.([a-zA-Z0-9.-]+)/g,
    };
    this.context = [];
  }

  getMatches(text, regex) {
    let matches = [];
    let match;
    while (match = regex.exec(text)) {
      matches.push(match[0]);
    }
    return matches;
  }
}

// let contextualizer = new Contextualizer();
// const data = `
// This is some random text with an MD5 hash: 
// a1d0c6e83f027327d8461063f4ac58a6. 

// It's just hanging out here, 
// waiting to be found. 

// Oh, and here's another one: 
// 8f14e45fceea167a5a36dedd4bea2543. 

// Just a couple of MD5s in the wild. 
// Carry on... nothing to see here. 
// `;

// let matches = contextualizer.getMatches(data, contextualizer.expressions.md5);
// console.log(matches);

// export default Contextualizer;
