const fs = require('fs');

const streamProcess = (stream) => new Promise((resolve, reject) => {
  stream.on('close', (data) => {
    console.log('data', data);
    resolve();
  });

  stream.on('error', (err) => {
    console.error('err', err);
    reject(err);
  });
});

(async function f() {
  try {
    const stream = fs.createReadStream('./public/1.txt');

    const write = fs.createWriteStream('./2.txt');

    stream.pipe(write);

    await streamProcess(stream);
  } catch (err) {
    console.error('handled');
    console.error(err);
  }
})();
