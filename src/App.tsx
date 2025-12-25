import { Layout } from './components/Layout';
import { ChatInterface } from './components/ChatInterface';
import { MemoryView } from './components/MemoryView';
import { SettingsView } from './components/SettingsView';
import { MemoryProvider, useMemoryContext } from './context/MemoryContext';
import { UIProvider } from './context/UIContext';

import { HistoryView } from './components/HistoryView';

import { ModelsView } from './components/ModelsView';
import { SecurityView } from './components/SecurityView';

// Inner component to consume context
const MainContent = () => {
  const { activeView } = useMemoryContext();

  return (
    <Layout>
      {activeView === 'chat' && <ChatInterface />}
      {activeView === 'memory' && <MemoryView />}
      {activeView === 'settings' && <SettingsView />}
      {activeView === 'history' && <HistoryView />}
      {activeView === 'models' && <ModelsView />}
      {activeView === 'security' && <SecurityView />}
    </Layout>
  );
};

import { GlobalErrorBoundary } from './components/GlobalErrorBoundary';

function App() {
  return (
    <GlobalErrorBoundary>
      <MemoryProvider>
        <UIProvider>
          <MainContent />
        </UIProvider>
      </MemoryProvider>
    </GlobalErrorBoundary>
  );
}

export default App;
