import https from 'https';

const session = '4176xcbcf4c2b674993706c0dff2971c6f9f4';
const envName = 'admissionspsna';
const nodeId = '277846';

const bashScript = `
pm2 logs psna-admissions --lines 30 --raw
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
