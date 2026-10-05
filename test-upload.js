const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

async function testUpload() {
  const boundary = '----WebKitFormBoundary' + crypto.randomBytes(8).toString('hex');
  const dummyFile = Buffer.from('hello world');
  
  let body = '';
  body += `--${boundary}\r\n`;
  body += `Content-Disposition: form-data; name="folder"\r\n\r\n`;
  body += `test_folder\r\n`;
  body += `--${boundary}\r\n`;
  body += `Content-Disposition: form-data; name="file"; filename="test.txt"\r\n`;
  body += `Content-Type: text/plain\r\n\r\n`;
  body += dummyFile.toString() + `\r\n`;
  body += `--${boundary}--\r\n`;

  try {
    const res = await fetch('http://localhost:3000/api/spmb/upload', {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      },
      body: body
    });

    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Response:", text);
  } catch (err) {
    console.error(err);
  }
}

testUpload();
