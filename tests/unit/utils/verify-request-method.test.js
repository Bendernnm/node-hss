const { verifyRequestMethod } = require('../../../src/utils');

it('should return true, when method is GET', () => {
  const METHOD = 'GET';
  const result = verifyRequestMethod(METHOD);

  expect(result).toBe(true);
});

it('should return true, when method is HEAD', () => {
  const METHOD = 'HEAD';
  const result = verifyRequestMethod(METHOD);

  expect(result).toBe(true);
});

it('should return false, when method is invalid', () => {
  const METHOD = 'POST';
  const result = verifyRequestMethod(METHOD);

  expect(result).toBe(false);
});
