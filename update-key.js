const fs = require('fs');

const keyJson = JSON.parse(fs.readFileSync('new-key.json', 'utf8'));
const privateKey = keyJson.private_key;

let yaml = fs.readFileSync('env.yaml', 'utf8');

// Base64 encode the perfect uncorrupted key
const b64 = Buffer.from(privateKey, 'utf8').toString('base64');

// Update env.yaml
yaml = yaml.replace(/GOOGLE_PRIVATE_KEY_BASE64: "(.*?)"/, 'GOOGLE_PRIVATE_KEY_BASE64: "' + b64 + '"');
fs.writeFileSync('env.yaml', yaml);

console.log('Successfully updated env.yaml with fresh uncorrupted base64 key');
