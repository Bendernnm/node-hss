module.exports = async (staticPath, files) => {
  let listOfItems = '';
  const indexOfLastSymbol = staticPath.length - 1;
  const path = staticPath[indexOfLastSymbol] === '/'
    ? staticPath.substring(0, indexOfLastSymbol)
    : staticPath;

  files.forEach(file => listOfItems += `<li><a href="${path}/${file}">${file}</a></li>`);

  return `<!DOCTYPE html>
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
};
