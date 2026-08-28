const crypto = require('crypto');
const fs = require('fs');
const yaml = fs.readFileSync('env.yaml', 'utf8');
const match = yaml.match(/GOOGLE_PRIVATE_KEY_BASE64: "(.*?)"/);
const p = Buffer.from(match[1], 'base64').toString('utf8');
try {
  crypto.createPrivateKey(p);
  console.log('Success decoding key');
} catch (e) {
  console.error(e.message);
}
