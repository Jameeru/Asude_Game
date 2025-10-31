import App from './App'; // Original chess game (includes Board)
import './MainApp.css';

const MainApp = () => {
  return (
    <div className="main-app">
      <div className="app-container">
        <App />
      </div>
    </div>
  );
};

export default MainApp;