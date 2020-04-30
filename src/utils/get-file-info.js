const path = require('path');

const mime = require('mime');

module.exports = (staticPath, url, useDefaultFileName = true) => {
  let fileName = url;

  if (useDefaultFileName && url === '/') {
    fileName = '/index.html';
  }

  const fileOriginName = url.split('/').pop();
  const filePath = path.join(staticPath, fileName);
  const fileExtension = path.extname(fileName).substring(1);
  const fileMimeType = mime.getType(fileExtension);

  return {
    fileName,
    filePath,
    fileMimeType,
    fileExtension,
    fileOriginName,
  };
};
