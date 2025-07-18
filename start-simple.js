// Simple server starter that avoids path issues
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  try {
    console.log('Starting simple development server...');
    
    const app = express();
    const port = 5000;
    
    // Basic middleware
    app.use(express.json());
    app.use(express.static('client'));
    
    // Basic route for health check
    app.get('/api/health', (req, res) => {
      res.json({ status: 'OK', timestamp: new Date().toISOString() });
    });
    
    // Serve the main HTML file
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'client', 'index.html'));
    });
    
    app.listen(port, '0.0.0.0', () => {
      console.log(`Simple server running on http://localhost:${port}`);
      console.log('You can now run: npx electron .');
    });
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();