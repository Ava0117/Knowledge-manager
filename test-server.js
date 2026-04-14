const express = require('express');
const app = express();
const PORT = 3001;

app.get('/', (req, res) => {
    res.send('<html><body><h1>Test Server Works!</h1></body></html>');
});

app.get('/test', (req, res) => {
    res.json({ status: 'ok', message: 'Express is working!' });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Test server running on http://localhost:${PORT}`);
});
