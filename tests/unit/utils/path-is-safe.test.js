const { pathIsSafe } = require('../../../src/utils');

it('should return true, when file\'s path started the same like static path', () => {
  const result = pathIsSafe('/static/index.html', '/static');

  expect(result).toBe(true);
});

it('should return false, when file\'s path didn\'t start the same like static path', () => {
  const result = pathIsSafe('/static/index.html', '/public');

  expect(result).toBe(false);
});
