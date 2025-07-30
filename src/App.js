import React from 'react';
import OdooConnectionManager from './components/OdooConnectionManager';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Odoo 프론트엔드 관리자</h1>
        <p>데이터베이스 연결 및 모듈 로드 과정을 관리하세요</p>
      </header>
      <main>
        <OdooConnectionManager />
      </main>
    </div>
  );
}

export default App;
