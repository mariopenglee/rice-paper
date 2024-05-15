// src/App.tsx

import React, { useEffect, useState } from 'react';
import './App.css';
import Grid from './components/Grid';
import { Provider } from 'react-redux';
import { initializeStore } from './redux/store.tsx';
import { useParams } from 'react-router-dom';

const App: React.FC = () => {
  const { mapId } = useParams();
  const [store, setStore] = useState<any>(null);
  useEffect(() => {
    const initialize = async () => {
      const store = await initializeStore(mapId ?? '');
      setStore(store);
    };
    initialize();
  }, [mapId]);

  if (!store) {
    return <div>Loading...</div>;
  }
  return (
    <div className="App">
      <Provider store={store}>
        <Grid />
      </Provider>
    </div>
  );
};

export default App;
