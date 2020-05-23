const { buildDirectoryStructure } = require('../../../src/utils');

it('should show empty list if any file not found', () => {
  const staticPath = '/static';
  const emptyDirectory = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>${staticPath}</title>
</head>
<body>
<h2>Directory (${staticPath}):</h2>
<ul></ul>
</body>
</html>`;

  const directoriesStructure = buildDirectoryStructure(staticPath, []);

  expect(directoriesStructure).toBe(emptyDirectory);
});

describe('Passed several files', () => {
  it('should show list with passed files', () => {
    const staticPath = '/static';
    const listOfItems = `<li><a href="${staticPath}/1.txt">1.txt</a></li><li><a href="${staticPath}/folder">folder</a></li>`;
    const directoryWithFiles = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>${staticPath}</title>
</head>
<body>
<h2>Directory (${staticPath}):</h2>
<ul>${listOfItems}</ul>
</body>
</html>`;

    const directoriesStructure = buildDirectoryStructure(staticPath, [ '1.txt', 'folder' ]);

    expect(directoriesStructure).toBe(directoryWithFiles);
  });

  it('should show list with passed files, when static path end on /', () => {
    const staticPath = '/static';
    const listOfItems = `<li><a href="${staticPath}/1.txt">1.txt</a></li><li><a href="${staticPath}/folder">folder</a></li>`;
    const directoryWithFiles = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>${staticPath}</title>
</head>
<body>
<h2>Directory (${staticPath}):</h2>
<ul>${listOfItems}</ul>
</body>
</html>`;

    const directoriesStructure = buildDirectoryStructure(staticPath, [ '1.txt', 'folder' ]);

    expect(directoriesStructure).toBe(directoryWithFiles);
  });

  it('should show list with passed files, static path is /', () => {
    const staticPath = '/';
    const listOfItems = `<li><a href="${staticPath}/1.txt">1.txt</a></li><li><a href="${staticPath}/2.txt">2.txt</a></li>`;
    const directoryWithFiles = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>${staticPath}</title>
</head>
<body>
<h2>Directory (${staticPath}):</h2>
<ul>${listOfItems}</ul>
</body>
</html>`;

    const directoriesStructure = buildDirectoryStructure(staticPath, [ '1.txt', '2.txt' ]);

    expect(directoriesStructure).toBe(directoryWithFiles);
  });
});
