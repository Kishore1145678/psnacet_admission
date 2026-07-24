import https from 'https';

const session = '4176xcbcf4c2b674993706c0dff2971c6f9f4';
const envName = 'admissionspsna';
const nodeId = '276503';

const script = `
cd /home/jelastic/ROOT 2>/dev/null || cd /home/jelastic
pm2 delete all || true

echo "Cleaning up old build files for a completely fresh start..."
rm -rf node_modules .next package-lock.json

cat << 'EOF' > .env.production
DATABASE_URL="postgresql://webadmin:MAPlqk90284@node276505-admissionspsna.in1.cloudlets.co.in:5432/postgres"
ENCRYPTION_KEY_BASE64="kQ8N3XzR5mP9vL1wK6jF4tY7sB2hA0cE+uD8iO3pQ5s="
NEXT_PUBLIC_APP_URL="https://admissions.psnacet.edu.in"
EOF

npm install
npm run db:setup
npm run build
PORT=8080 pm2 start npm --name "psna-admissions" -- start
pm2 save
`;

const commandList = JSON.stringify([{
  command: script
}]);

const url = `https://app.cloudlets.co.in/1.0/environment/control/rest/execcmdbyid`;
const postData = `session=${session}&envName=${envName}&nodeid=${nodeId}&commandList=${encodeURIComponent(commandList)}`;

const options = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = https.request(url, options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log(data);
  });
});

req.on('error', (e) => {
  console.error(e);
});

req.write(postData);
req.end();
