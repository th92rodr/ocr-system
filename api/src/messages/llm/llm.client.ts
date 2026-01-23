export abstract class LLMClient {
  abstract generateResponse(prompt: string): Promise<string>;
}
