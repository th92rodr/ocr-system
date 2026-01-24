export class EmptyOcrResultError extends Error {
  constructor() {
    super('OCR completed but extracted text is empty');
    this.name = 'EmptyOcrResultError';
  }
}
