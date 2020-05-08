module.exports = (readStream, writeStream) => new Promise((resolve, reject) => {
  writeStream.on('close', () => resolve());

  readStream.on('error', err => reject(err));
  writeStream.on('error', err => reject(err));

  readStream.pipe(writeStream);
});
