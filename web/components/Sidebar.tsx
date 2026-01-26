import type { Document } from '@/lib/types';

type SidebarProps = {
  documents: Document[];
  documentId?: string;
  onSelect: (documentId: string) => void;
  onUpload: () => void;
  onLogout: () => void;
};

export function Sidebar({ documents, documentId, onSelect, onUpload, onLogout }: SidebarProps) {
  return (
    <aside className='flex flex-col w-64 bg-gray-900 border-r-2 border-gray-800'>
      <div className='p-4 font-bold text-lg border-b border-gray-800'>Documents</div>

      <button type='button'
        onClick={onUpload}
        className='p-4 text-m border-b border-gray-800 text-gray-100 hover:text-gray-300 hover:bg-gray-800 cursor-pointer'>
        Upload document
      </button>

      <div className='flex-1 overflow-y-auto mt-5'>
        {documents.map((document) => {
          const isStatusFailed = document.status === 'FAILED';
          const isSelected = documentId === document.id;

          return (
            <button type='button'
              key={document.id}
              onClick={() => !isStatusFailed && onSelect(document.id)}
              disabled={isStatusFailed}
              className={`w-full flex items-center gap-2 px-4 py-2 text-sm text-left
                ${isStatusFailed ? 'opacity-60' : isSelected ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-800 cursor-pointer'}`}>
              {isStatusFailed ? <span aria-hidden>❌</span> : <span>✅</span>}
              <span className='truncate'>{document.fileName}</span>
            </button>
          );
        })}
      </div>

      <button type='button'
        onClick={onLogout}
        className='p-4 text-m text-red-400 hover:text-red-500 hover:bg-gray-800 cursor-pointer'>
        Logout
      </button>
    </aside>
  );
}
