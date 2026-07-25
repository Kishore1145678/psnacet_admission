import https from 'https';
const session = '4176xcbcf4c2b674993706c0dff2971c6f9f4';

// Quick restart PM2 with PORT=80 on the Node.js server (276503)
const bashScript = `
cd /home/jelastic/ROOT
pm2 delete all || true
echo "Clearing PM2 logs..."
pm2 flush

echo "Starting Next.js on port 80..."
HOSTNAME=0.0.0.0 PORT=80 NODE_ENV=production pm2 start npm --name "psna-admissions" --cwd "/home/jelastic/ROOT" -- start
pm2 save

echo "Waiting 3 seconds for startup..."
sleep 3

echo "=== PM2 STATUS ==="
pm2 list

echo "=== PORT CHECK ==="
ss -tlnp | grep -E ":80 |:8080"

echo "=== CURL CHECK ==="
curl -sI http://localhost:80/ 2>&1 | head -5
`;
const script = `echo "${Buffer.from(bashScript).toString('base64')}" | base64 -d | bash`;
const postData = `session=${session}&envName=admissionspsna&nodeid=276503&commandList=${encodeURIComponent(JSON.stringify([{command: script}]))}`;
const req = https.request('https://app.cloudlets.co.in/1.0/environment/control/rest/execcmdbyid', {method: 'POST', headers: {'Content-Type': 'application/x-www-form-urlencoded'}}, res => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    try {
      const parsed = JSON.parse(d);
      const r = parsed.responses[0];
      console.log("=== STDOUT ===");
      console.log(r.out);
      if (r.errOut) { console.log("=== STDERR ==="); console.log(r.errOut); }
    } catch(e) { console.log(d); }
  });
});
req.write(postData);
req.end();
