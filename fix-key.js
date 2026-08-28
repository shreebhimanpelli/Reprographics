const fs = require('fs');

// Read env.yaml
let yaml = fs.readFileSync('env.yaml', 'utf8');

// Extract current key
const match = yaml.match(/GOOGLE_PRIVATE_KEY: "(.*?)"/);
if (match) {
  // It has literal \n in the string right now. Let's replace them with real newlines.
  const realKey = match[1].replace(/\\n/g, '\n');
  
  // Base64 encode it
  const b64 = Buffer.from(realKey, 'utf8').toString('base64');
  
  // Update env.yaml
  yaml = yaml.replace(/GOOGLE_PRIVATE_KEY: "(.*?)"/, 'GOOGLE_PRIVATE_KEY_BASE64: "' + b64 + '"');
  fs.writeFileSync('env.yaml', yaml);
  
  console.log('Converted to Base64 successfully in env.yaml');
} else {
  console.log('Could not find GOOGLE_PRIVATE_KEY in env.yaml');
}
