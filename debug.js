const fs = require('fs');
let yaml = fs.readFileSync('env.yaml', 'utf8');
const match = yaml.match(/GOOGLE_PRIVATE_KEY_BASE64: "(.*?)"/);
const decoded = Buffer.from(match[1], 'base64').toString('utf8');
console.log(JSON.stringify(decoded));
