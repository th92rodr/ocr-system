'use client';

type MessageProps = {
  role: 'USER' | 'ASSISTANT';
  content: string;
};

export function MessageBubble({ role, content }: MessageProps) {
  const isUser = role === 'USER';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}>
      <div
        className={`max-w-[75%] rounded-lg px-4 py-2 text-sm leading-relaxed
          ${isUser ? 'bg-gray-800 text-gray-100' : 'bg-gray-700 text-gray-100'}
        `}
      >
        <strong>{role}</strong>
        <p>{content}</p>
      </div>
    </div>
  );
}
