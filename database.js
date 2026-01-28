const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'pollution.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`DROP TABLE IF EXISTS segments`);
  // Road segments with pollution scores
  db.run(`CREATE TABLE IF NOT EXISTS segments (
    id TEXT PRIMARY KEY,
    name TEXT,
    start_lat REAL,
    start_lng REAL,
    end_lat REAL,
    end_lng REAL,
    base_pollution REAL,
    traffic_density REAL,
    road_type TEXT,
    length REAL,
    travel_time INTEGER
  )`);

  // History for analytics
  db.run(`CREATE TABLE IF NOT EXISTS pollution_history (
    segment_id TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    value REAL
  )`);

  // Insert more sample data for major Indian cities
  const sampleSegments = [
    // Mumbai
    ['mumbai-1', 'Western Express Highway', 19.0760, 72.8777, 19.1000, 72.8800, 85, 0.95, 'Highway', 2.5, 300],
    ['mumbai-2', 'SVT Road', 19.1000, 72.8800, 19.1200, 72.8900, 45, 0.6, 'Main Road', 1.8, 240],
    ['mumbai-3', 'Juhu Lane', 19.1100, 72.8300, 19.1150, 72.8350, 25, 0.3, 'Residential', 0.8, 120],
    ['mumbai-4', 'Link Road', 19.1300, 72.8300, 19.1500, 72.8400, 65, 0.75, 'Main Road', 2.2, 400],
    ['mumbai-5', 'Eastern Express Highway', 19.0500, 72.9000, 19.0700, 72.9200, 92, 0.98, 'Highway', 3.0, 360],
    ['mumbai-6', 'Marine Drive', 18.9400, 72.8200, 18.9600, 72.8100, 30, 0.4, 'Tourist', 2.0, 180],
    ['mumbai-7', 'LBS Marg', 19.0800, 72.9100, 19.1000, 72.9200, 78, 0.85, 'Main Road', 2.1, 450],
    ['mumbai-8', 'Linking Road', 19.0600, 72.8300, 19.0800, 72.8400, 55, 0.7, 'Main Road', 2.3, 380],

    // Delhi
    ['delhi-1', 'Outer Ring Road', 28.6139, 77.2090, 28.6300, 77.2200, 110, 0.95, 'Highway', 4.0, 600],
    ['delhi-2', 'Janpath', 28.6129, 77.2195, 28.6000, 77.2100, 40, 0.5, 'Avenue', 1.5, 200],
    ['delhi-3', 'MG Road', 28.4595, 77.0266, 28.4700, 77.0400, 95, 0.9, 'Main Road', 3.2, 500],
    ['delhi-4', 'Amrita Shergill Marg', 28.5900, 77.2200, 28.5800, 77.2100, 20, 0.2, 'Residential', 1.2, 150],
    ['delhi-5', 'DND Flyway', 28.5700, 77.2700, 28.5500, 77.3000, 120, 0.98, 'Expressway', 5.0, 400],
  ];

  const stmt = db.prepare("INSERT OR REPLACE INTO segments VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
  sampleSegments.forEach(seg => stmt.run(seg));
  stmt.finalize();
});

module.exports = db;

