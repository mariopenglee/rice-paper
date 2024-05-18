import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { HashRouter as Router, Route, Routes } from 'react-router-dom';
import NewMap from './components/NewMap.tsx';
// Function to initialize and render the application
const renderApp = async () => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <Router>
      <Routes>
        <Route path="/map/:mapId" element={<App />} />
        <Route path="/" element={<NewMap />} />
      </Routes>
    </Router>
  );
};

renderApp();
