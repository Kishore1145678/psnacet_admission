import https from 'https';

const session = '4176xcbcf4c2b674993706c0dff2971c6f9f4';
const envName = 'admissionspsna';
const nodeId = '277846';

const bashScript = `
pm2 delete all || true

echo "Pulling latest code from GitHub..."
[ -d "/home/jelastic/ROOT/.git" ] && (cd /home/jelastic/ROOT && git fetch --all && git reset --hard origin/main && git pull origin main) || (cd /home/jelastic && rm -rf ROOT && git clone https://github.com/Kishore1145678/psnacet_admission.git ROOT)

echo "Cleaning up old build files for a completely fresh start..."
cd /home/jelastic/ROOT
rm -rf node_modules .next

echo "DATABASE_URL=\"postgresql://webadmin:MAPlqk90284@node276505-admissionspsna.in1.cloudlets.co.in:5432/postgres\"" > .env.production
echo "ENCRYPTION_KEY_BASE64=\"kQ8N3XzR5mP9vL1wK6jF4tY7sB2hA0cE+uD8iO3pQ5s=\"" >> .env.production
echo "NEXT_PUBLIC_APP_URL=\"https://admissions.psnacet.edu.in\"" >> .env.production

npm ci || npm install
NODE_ENV=production npm run db:setup
NODE_ENV=production npm run build
HOSTNAME=0.0.0.0 PORT=8080 NODE_ENV=production pm2 start npm --name "psna-admissions" --cwd "/home/jelastic/ROOT" -- start
pm2 save
`;

const script = `echo "${Buffer.from(bashScript).toString('base64')}" | base64 -d | bash`;

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
