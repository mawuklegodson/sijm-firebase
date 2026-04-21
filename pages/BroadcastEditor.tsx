// BroadcastEditor.tsx
// Re-exports AnnouncementsPage in broadcasts view as a named page component
import React from 'react';
import AnnouncementsPage from './AnnouncementsPage';

interface BroadcastEditorProps {
  store: any;
  navigate: (page: string) => void;
}

const BroadcastEditor: React.FC<BroadcastEditorProps> = ({ store, navigate }) => {
  return <AnnouncementsPage store={store} navigate={navigate} defaultView="broadcasts" />;
};

export default BroadcastEditor;
