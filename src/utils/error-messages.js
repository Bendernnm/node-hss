class ErrorMessages {
  constructor({ useTemplates }) {
    this.type = useTemplates ? 'template' : 'text';
    this.texts = {};
    this.templates = {};
  }

  setTemplates(templates) {
    this.setObjects('templates', templates);
  }

  setTexts(texts) {
    this.setObjects('texts', texts);
  }

  setObjects(type, objects) {
    if (type !== 'texts' || type !== 'templates') {
      throw new Error('Incorrect type');
    }

    Object.keys(objects).forEach(key => this[type][key] = objects[key]);
  }

  msg(errorName) {
    return this[this.type][errorName] || 'Error message';
  }

  static create(opts) {
    return new ErrorMessages(opts);
  }
}

module.exports = ErrorMessages;
