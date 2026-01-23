export class DocumentNotProcessedError extends Error {
  constructor() {
    super('Document not processed yet');
    this.name = 'DocumentNotProcessedError';
  }
}
