'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { AuthGuard } from '@/components/AuthGuard';
import { DocumentViewer } from '@/components/DocumentViewer';
import { Sidebar } from '@/components/Sidebar';
import { UploadModal } from '@/components/UploadModal';
import { fetchDocuments, uploadDocument } from '@/lib/api/documents';
import { useAuth } from '@/lib/auth/auth-context';
import type { Document } from '@/lib/types';

export default function Home() {
  const router = useRouter();
  const { logout, token } = useAuth();

  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  function handleLogout() {
    logout();
    router.replace('/login');
  }

  useEffect(() => {
    async function load() {
      const data = await fetchDocuments(token!);
      setDocuments(data);
    }

    load();
  }, [token]);

  async function handleUpload(file: File) {
    const newDocument = await uploadDocument(file, token!);
    setDocuments((prev) => [newDocument, ...prev]);
    setSelectedDocumentId(newDocument.id);
  }

  return (
    <AuthGuard>
      <div className='flex h-screen bg-gray-950 text-gray-100'>
        <Sidebar
          documents={documents}
          documentId={selectedDocumentId ?? undefined}
          onSelect={setSelectedDocumentId}
          onUpload={() => setShowUpload(true)}
          onLogout={handleLogout}
        />

        <main className='flex-1 p-4 overflow-hidden bg-gray-900'>
          <DocumentViewer documentId={selectedDocumentId ?? undefined} />
        </main>
      </div>

      <UploadModal
        isOpen={showUpload}
        onClose={() => setShowUpload(false)}
        onUpload={handleUpload}
      />
    </AuthGuard>
  );
}
