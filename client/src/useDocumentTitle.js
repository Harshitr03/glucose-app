import { useEffect } from 'react';

export default function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} – Sweety` : 'Sweety';
  }, [title]);
}
