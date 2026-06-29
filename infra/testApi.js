const http = require('https');

const registerData = JSON.stringify({ name: 'test5', email: 'test5@test.com', password: 'password123', pin: '1234', role: 'Admin', rootPassword: 'odoomasterkey' });
const loginData = JSON.stringify({ email: 'test5@test.com', password: 'password123' });

const makeRequest = (path, method, body, token) => new Promise((resolve, reject) => {
  const req = http.request({
    hostname: 't2l258pnui.execute-api.us-east-1.amazonaws.com',
    port: 443,
    path: path,
    method: method,
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => resolve({ status: res.statusCode, data }));
  });
  req.on('error', reject);
  req.write(body);
  req.end();
});

async function runTest() {
  try {
    let res = await makeRequest('/api/auth/register', 'POST', registerData);
    let json = JSON.parse(res.data);
    if (!json.token) {
      res = await makeRequest('/api/auth/login', 'POST', loginData);
      json = JSON.parse(res.data);
    }
    const token = json.token;
    console.log("Token:", !!token);

    const catRes = await makeRequest('/api/categories', 'GET', '', token);
    console.log('Categories Status:', catRes.status);
    console.log('Categories Response:', catRes.data);
  } catch (err) {
    console.error("Test failed:", err);
  }
}
runTest();
