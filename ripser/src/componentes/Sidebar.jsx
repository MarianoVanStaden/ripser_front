import './Sidebar.css';

export default function Sidebar() {
  return (
    <div className="sidebar">
      <h1 className="title">Paperbase</h1>
      <div className="section">
        <div className="item">🏠 Project Overview</div>
      </div>

      <div className="section-title">Build</div>
      <div className="section">
        <div className="item">👥 Authentication</div>
        <div className="item">🗄️ Database</div>
        <div className="item">🖼️ Storage</div>
        <div className="item">🌐 Hosting</div>
        <div className="item">🧩 Functions</div>
        <div className="item">🧠 Machine learning</div>
      </div>

      <div className="section-title">Quality</div>
      <div className="section">
        <div className="item">📊 Analytics</div>
        <div className="item">⏱️ Performance</div>
        <div className="item">🧪 Test Lab</div>
      </div>
    </div>
  );
}
