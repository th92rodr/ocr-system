'use client';

import { useEffect, useState } from 'react';

import { MessageBubble } from '@/components/MessageBubble';
import { downloadDocument } from '@/lib/api/documents';
import { fetchMessages, sendMessage } from '@/lib/api/messages';
import { useAuth } from '@/lib/auth/auth-context';
import type { Message } from '@/lib/types';

type DocumentViewerProps = {
  documentId?: string;
};

export function DocumentViewer({ documentId }: DocumentViewerProps) {
  const { token } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!documentId || !token) return;

    async function load() {
      const data = await fetchMessages(documentId!, token!);
      setMessages(data);
    }

    load();
  }, [documentId, token]);

  if (!documentId) {
    return (
      <div className='h-full flex items-center justify-center text-gray-400'>
        Select a document from the sidebar
      </div>
    );
  }

  async function handleSend() {
    if (!input.trim() || !documentId || !token) return;

    setSending(true);
    await sendMessage(documentId, input, token);
    setInput('');
    setSending(false);

    const data = await fetchMessages(documentId, token);
    setMessages(data);
  }

  async function handleDownload() {
    if (!documentId || !token) return;

    try {
      setDownloading(true);

      const { blob, filename } = await downloadDocument(documentId, token);

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

    } catch {
      alert('Failed to download document');
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className='h-full flex flex-col'>
      <header className='flex items-center justify-between border-b border-gray-800 pb-2 mb-2'>
        <h2 className='text-xl font-semibold'>Document Chat</h2>

        <button type='button'
          onClick={handleDownload}
          disabled={downloading}
          className='text-sm px-3 py-1 border border-gray-700 rounded hover:bg-gray-800 disabled:opacity-50 enabled:cursor-pointer'>
          {downloading ? 'Downloading…' : 'Download'}
        </button>
      </header>

      <div className='flex-1 overflow-y-auto mb-2 px-2'>
        {messages.length === 0 ? (
          <div className='h-full flex items-center justify-center'>
            <div className='text-center text-gray-400 max-w-sm'>
              <p className='text-sm'>Ask a question about this document to get started.</p>
            </div>
          </div>
        ) : (
          <div className='space-y-3'>
            {messages.map((message) => (
              <MessageBubble key={message.id} role={message.role} content={message.content} />
            ))}
          </div>
        )}
      </div>

      <form className='flex gap-2'
        onSubmit={(event) => {
          event.preventDefault();
          handleSend();
        }}>
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          disabled={sending}
          className='flex-1 border border-gray-700 bg-gray-900 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-700 disabled:opacity-50'
          placeholder='Ask something about the document...' />
        <button type='submit'
          disabled={!input.trim() || sending}
          className='px-4 py-2 bg-gray-100 text-gray-900 rounded enabled:hover:bg-white disabled:opacity-50 enabled:cursor-pointer'>
          {sending ? 'Sending…' : 'Send'}
        </button>
      </form>
    </div>
  );
}
