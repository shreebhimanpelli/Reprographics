const fs = require('fs');
let yaml = fs.readFileSync('env.yaml', 'utf8');
const keyMatch = yaml.match(/GOOGLE_PRIVATE_KEY: \|\s+([-\w\s\+\/=\n]+)\nGOOGLE_DRIVE/s);
if (keyMatch) {
  const flattened = keyMatch[1].split('\n').map(l => l.trim()).filter(Boolean).join('\\n');
  const newYaml = yaml.replace(keyMatch[0], 'GOOGLE_PRIVATE_KEY: "' + flattened + '"\nGOOGLE_DRIVE');
  fs.writeFileSync('env.yaml', newYaml);
  console.log('done');
} else {
  console.log('match failed');
}
