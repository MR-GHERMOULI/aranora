const fs = require('fs');
const content = fs.readFileSync('.env.local', 'utf8');
const lines = content.split('\n');
lines.forEach(line => {
  const parts = line.split('=');
  if (parts.length > 1) {
    const key = parts[0];
    const value = parts[1];
    console.log(`${key}=${value.substring(0, 3)}...${value.substring(value.length - 3)}`);
  } else {
    console.log(line);
  }
});
