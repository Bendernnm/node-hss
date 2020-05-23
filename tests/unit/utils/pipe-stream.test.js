const { EventEmitter } = require('events');

const { pipeStreams } = require('../../../src/utils');

let err;
let readStream;
let writeStream;

beforeEach(() => {
  err = new Error('stream error');
  readStream = new EventEmitter();
  writeStream = new EventEmitter();
});

it('should throw error, when read stream throws error', () => {
  readStream.pipe = () => readStream.emit('error', err);

  return expect(pipeStreams(readStream, writeStream)).rejects.toThrowError(err);
});

it('should throw error, when write stream throws error', () => {
  readStream.pipe = () => writeStream.emit('error', err);

  return expect(pipeStreams(readStream, writeStream)).rejects.toThrowError(err);
});

it('should resolve, when write stream successfully close', () => {
  readStream.pipe = () => writeStream.emit('close');

  return expect(pipeStreams(readStream, writeStream)).resolves.toBe(undefined);
});
