const fs = require('fs');

const pipeStreams = (readStream, writeStream) => new Promise((resolve, reject) => {
  writeStream.on('close', () => resolve());

  readStream.on('error', err => reject(err));
  writeStream.on('error', err => reject(err));

  readStream.pipe(writeStream);
});

(async function f() {
  try {
    const readStream = fs.createReadStream('./public/1.txt');
    const writeStream = fs.createWriteStream('./2.txt');

    await pipeStreams(readStream, writeStream);
  } catch (err) {
    console.error('handled');
    console.error(err);
  }
})();
