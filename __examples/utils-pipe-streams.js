const fs = require('fs');

const { pipeStreams } = require('../src/utils');

(async function main() {
  try {
    const readStream = fs.createReadStream('./public/1.txt');
    const writeStream = fs.createWriteStream('./2.txt');

    await pipeStreams(readStream, writeStream);

    console.log('finished');
  } catch (err) {
    console.error('handled');
    console.error(err);
  }
}());
