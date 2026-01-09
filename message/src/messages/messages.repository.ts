import { Injectable } from '@nestjs/common';
import { readFile, writeFile } from 'fs/promises';

export interface Message {
  id: string;
  content: string;
}

type MessageMap = Record<string, Message>;

@Injectable()
export class MessagesRepository {
  async findOne(id: string) {
    const contents = await readFile('messages.json', 'utf-8');
    const messages = JSON.parse(contents) as MessageMap;

    return messages[id];
  }

  async findAll() {
    const contents = await readFile('messages.json', 'utf-8');
    const messages = JSON.parse(contents) as MessageMap;

    return messages;
  }

  async create(content: string) {
    const contents = await readFile('messages.json', 'utf-8');
    const messages = JSON.parse(contents) as MessageMap;

    const id = String(Math.floor(Math.random() * 999));

    messages[id] = { id, content };

    await writeFile('messages.json', JSON.stringify(messages));
  }
}
