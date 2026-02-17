import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

import { LLMClient } from './llm.client';

@Injectable()
export class GroqClient implements LLMClient {
  private readonly client: OpenAI;
  private readonly model: string;

  constructor(private readonly config: ConfigService) {
    this.client = new OpenAI({
      apiKey: config.get<string>('LLM_API_KEY'),
      baseURL: 'https://api.groq.com/openai/v1',
    });
    this.model = config.get<string>('LLM_MODEL')!;
  }

  async generateResponse(prompt: string): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: prompt },
      ],
    });

    return response.choices[0].message.content ?? '';
  }
}
