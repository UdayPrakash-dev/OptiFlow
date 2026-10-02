import Navbar from './components/Navbar/Navbar';
import Sidebar from './components/Sidebar/Sidebar';
import './App.css';

function App() {
  return (
    <div className="app">
      <Navbar title="Dashboard" />

      <div className="pageLayout">
        <Sidebar />

        <main className="content" id="dashboard">
          <h2>Welcome to OfficeSync</h2>
          <p>This page is only for testing the React Navbar and Sidebar.</p>
        </main>
      </div>
    </div>
  );
}

export default App;
