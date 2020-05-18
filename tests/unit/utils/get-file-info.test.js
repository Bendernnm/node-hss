const path = require('path');

const mime = require('mime');

const { getFileInfo } = require('../../../src/utils');

function filesBeforeAllMocks({ staticPath, url, fileExtension, fileMimeType }) {
  jest.clearAllMocks();

  jest.spyOn(path, 'extname').mockReturnValue(`.${fileExtension}`);
  jest.spyOn(path, 'join').mockReturnValue(`${staticPath}${url}`);

  jest.spyOn(mime, 'getType').mockReturnValue(fileMimeType);
}

describe('Custom files', () => {
  const url = '/public/1.txt';
  const staticPath = '/static';

  const fileExtension = 'txt';
  const fileMimeType = 'text/plain';
  const filePath = `${staticPath}${url}`;

  beforeAll(() => filesBeforeAllMocks({
    url,
    staticPath,
    fileMimeType,
    fileExtension,
  }));

  it('should return file info, useDefaultFileName = true', () => {
    const fileInfo = getFileInfo(staticPath, url, true);

    expect(fileInfo).toEqual({
      filePath,
      fileMimeType,
      fileExtension,
      fileName      : url,
      fileOriginName: '1.txt',
    });
  });

  it('should return file info, useDefaultFileName = false', () => {
    const fileInfo = getFileInfo(staticPath, url, false);

    expect(fileInfo).toEqual({
      filePath,
      fileMimeType,
      fileExtension,
      fileName      : url,
      fileOriginName: '1.txt',
    });
  });

  afterAll(() => jest.clearAllMocks());
});

describe('Default file', () => {
  const url = '/';
  const staticPath = '/static';

  const fileExtension = 'html';
  const fileMimeType = 'text/html';
  const filePath = `${staticPath}${url}`;

  beforeAll(() => filesBeforeAllMocks({
    url,
    staticPath,
    fileMimeType,
    fileExtension,
  }));

  it('should return info about default file, using default file name', () => {
    const fileInfo = getFileInfo(staticPath, url, true);

    expect(fileInfo).toEqual({
      filePath,
      fileMimeType,
      fileExtension,
      fileName      : '/index.html',
      fileOriginName: 'index.html',
    });
  });

  afterAll(() => jest.clearAllMocks());
});
