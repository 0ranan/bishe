const http = require('http');

function testPOST() {
  const postData = JSON.stringify({
    title: '测试 todo',
    completed: false
  });

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/todos',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      console.log('POST 响应:', JSON.parse(data));
      testGET();
    });
  });

  req.on('error', (e) => {
    console.error('POST 请求失败:', e);
  });

  req.write(postData);
  req.end();
}

function testGET() {
  http.get('http://localhost:3000/api/todos', (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      console.log('GET 响应:', JSON.parse(data));
    });
  }).on('error', (e) => {
    console.error('GET 请求失败:', e);
  });
}

// 先测试 POST，再测试 GET
testPOST();
testGET();
