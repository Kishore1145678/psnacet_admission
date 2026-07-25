/**
 * deploy.mjs — One-shot Cloudlets deployment script
 *
 * Triggers a full production deployment on the Cloudlets (Jelastic) server:
 *   1. Pull latest code from GitHub
 *   2. Clean old build artifacts
 *   3. Install dependencies (npm ci)
 *   4. Run DB migrations / setup
 *   5. Build Next.js for production
 *   6. Start / restart app via PM2 on port 80
 *
 * Usage:
 *   node scripts/deploy.mjs
 *
 * To check logs after deploying:
 *   node scripts/read_cloudlets_logs.mjs
 */
import https from 'https';

// ─── Cloudlets credentials ────────────────────────────────────────────────────
const SESSION   = '4176xcbcf4c2b674993706c0dff2971c6f9f4';
const ENV_NAME  = 'admissionspsna';
const NODE_ID   = '276503';
// ─────────────────────────────────────────────────────────────────────────────

const bashScript = `
set -e

echo "=== [1/6] Navigating to app root ==="
cd /home/jelastic/ROOT 2>/dev/null || (cd /home/jelastic && git clone https://github.com/Kishore1145678/psnacet_admission.git ROOT && cd ROOT)

echo "=== [2/6] Pulling latest code from GitHub ==="
git fetch --all
git reset --hard origin/main
git pull origin main

echo "=== [3/6] Writing production environment file ==="
cat > .env.production << 'ENVEOF'
DATABASE_URL="postgresql://webadmin:MAPlqk90284@node276505-admissionspsna.in1.cloudlets.co.in:5432/postgres"
ENCRYPTION_KEY_BASE64="kQ8N3XzR5mP9vL1wK6jF4tY7sB2hA0cE+uD8iO3pQ5s="
NEXT_PUBLIC_APP_URL="https://admissions.psnacet.edu.in"
NODE_ENV="production"
ENVEOF

echo "=== [4/6] Installing dependencies ==="
rm -rf node_modules .next
npm ci

echo "=== [5/6] Running database setup / migrations ==="
NODE_ENV=production node --env-file=.env.production scripts/setup-db.mjs

echo "=== [6/6] Building Next.js for production ==="
NODE_ENV=production npm run build

echo "=== Starting app via PM2 ==="
pm2 delete all || true
HOSTNAME=0.0.0.0 PORT=80 NODE_ENV=production pm2 start npm \\
  --name "psna-admissions" \\
  --cwd "/home/jelastic/ROOT" \\
  -- start
pm2 save

echo "=== Deployment complete ==="
pm2 status
`;

// Encode as base64 to avoid shell quoting issues
const script = `echo "${Buffer.from(bashScript).toString('base64')}" | base64 -d | bash`;

const commandList = JSON.stringify([{ command: script }]);
const url = 'https://app.cloudlets.co.in/1.0/environment/control/rest/execcmdbyid';
const postData =
  `session=${SESSION}&envName=${ENV_NAME}&nodeid=${NODE_ID}` +
  `&commandList=${encodeURIComponent(commandList)}`;

const options = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(postData),
  },
};

console.log(`Triggering deployment to Cloudlets env: ${ENV_NAME} (node ${NODE_ID}) …`);

const req = https.request(url, options, (res) => {
  let data = '';
  res.on('data', (chunk) => (data += chunk));
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      const result = parsed?.responses?.[0]?.result ?? parsed?.result;
      if (result === 0) {
        const out = parsed?.responses?.[0]?.out ?? '';
        console.log('\n--- Server output ---');
        console.log(out || '(no output captured — deployment running in background)');
        console.log('\n✅ Deployment command accepted.');
        console.log('Run `node scripts/read_cloudlets_logs.mjs` to tail PM2 logs.');
      } else {
        console.error('\n❌ Deployment failed. Full response:');
        console.error(JSON.stringify(parsed, null, 2));
      }
    } catch {
      console.log('\nRaw response:', data);
    }
  });
});

req.on('error', (e) => {
  console.error('Request error:', e.message);
  process.exit(1);
});

req.write(postData);
req.end();
