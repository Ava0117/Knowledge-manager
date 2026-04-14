const https = require('https');

const requestBody = JSON.stringify({
    model: 'moonshot-v1-8k',
    messages: [
        { role: 'user', content: '你好，你是谁？' }
    ],
    temperature: 0.8
});

const options = {
    hostname: 'api.moonshot.cn',
    port: 443,
    path: '/v1/chat/completions',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer sk-e6QDPrC1f5f5Qr4zmCSMMmg7qP31apEdZ2LckDo3CjJ7rmkd',
        'Content-Length': Buffer.byteLength(requestBody)
    }
};

console.log('Testing Kimi API...');

const req = https.request(options, (res) => {
    console.log('Status:', res.statusCode);
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        console.log('Response:', data);
    });
});

req.on('error', (e) => {
    console.error('Error:', e.message);
});

req.write(requestBody);
req.end();