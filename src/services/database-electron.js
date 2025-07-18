@@ .. @@
   constructor() {
     try {
       // Get user data directory for database storage
-      const userDataPath = app.getPath('userData');
+      const userDataPath = path.join(process.cwd(), 'data');
       
       // Ensure the directory exists
       if (!fs.existsSync(userDataPath)) {
         fs.mkdirSync(userDataPath, { recursive: true });
       }
       
       const dbPath = path.join(userDataPath, 'taskflow.db');
       console.log('Database path:', dbPath);
       
       this.db = new Database(dbPath);
       this.db.pragma('journal_mode = WAL');
       this.initializeTables();
       console.log('Database initialized successfully');
     } catch (error) {
       console.error('Failed to initialize database:', error);
       throw error;
     }
   }