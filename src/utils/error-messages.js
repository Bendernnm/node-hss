class ErrorMessages {
  constructor({ useTemplates }) {
    this.type = useTemplates ? 'templates' : 'texts';
    this.texts = {};
    this.templates = {};
  }

  setTemplates(templates) {
    return this.setObjects('templates', templates);
  }

  setTexts(texts) {
    return this.setObjects('texts', texts);
  }

  setObjects(type, objects) {
    if (type !== 'texts' && type !== 'templates') {
      throw new Error('Incorrect type');
    }

    Object.keys(objects).forEach(key => this[type][key] = objects[key]);

    return this;
  }

  msg() {
    return this[this.type];
  }

  static create(opts) {
    return new ErrorMessages(opts);
  }
}

module.exports = ErrorMessages;
