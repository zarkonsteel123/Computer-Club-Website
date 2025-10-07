const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const session = require('express-session');
const cors = require('cors');  // CORS middleware import
const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// CORS setup (only needed if making cross-origin requests)
app.use(cors());  // Enable CORS for all routes

// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Session configuration
app.use(session({
  secret: 'bvm-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 3600000 } // 1 hour
}));

// Define the data directory in the project folder
const dataDir = path.join(__dirname, 'data');
const uploadsDir = path.join(__dirname, 'uploads');

// Ensure directories exist
try {
  if (!fs.existsSync(dataDir)) {
    console.log('Creating data directory...');
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(uploadsDir)) {
    console.log('Creating uploads directory...');
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
} catch (err) {
  console.error('Error creating directories:', err);
}

// File paths for data storage
const studentsFile = path.join(dataDir, 'students.json');
const teachersFile = path.join(dataDir, 'teachers.json');

// Initialize data files if they don't exist
try {
  if (!fs.existsSync(studentsFile)) {
    console.log('Creating students.json file...');
    const initialStudents = {
      "1": {
        name: "Rahul Sharma",
        grade: "Grade 12",
        image: "https://images.unsplash.com/photo-1581093450021-4a7360e9a6b5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80",
        bio: "Rahul is a passionate student with a keen interest in robotics and artificial intelligence.",
        currentProject: {
          title: "Autonomous Navigation Robot",
          type: "Robotics",
          description: "A self-navigating robot that uses sensors and AI to avoid obstacles.",
          components: "Arduino, Ultrasonic Sensors, Motors, Battery Pack",
          codingLanguage: "C++"
        },
        previousProjects: []
      },
      "2": {
        name: "Priya Singh",
        grade: "Grade 11",
        image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80",
        bio: "Priya is a talented programmer with expertise in web development and mobile app creation.",
        currentProject: {
          title: "Weather Forecast App",
          type: "Computer Science",
          description: "A web application that provides real-time weather information.",
          appUsed: "HTML, CSS, JavaScript, Weather API",
          codingLanguage: "JavaScript"
        },
        previousProjects: []
      },
      "3": {
        name: "Amit Patel",
        grade: "Grade 12",
        image: "https://images.unsplash.com/photo-1596495577886-d920f3fb7bfe?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80",
        bio: "Amit is an expert in hardware design and electronics.",
        currentProject: {
          title: "Precision Robotic Arm",
          type: "Robotics",
          description: "A 4-axis robotic arm capable of precise movements.",
          components: "Servo Motors, Arduino, Python, 3D Printed Parts",
          codingLanguage: "Python"
        },
        previousProjects: []
      }
    };
    fs.writeFileSync(studentsFile, JSON.stringify(initialStudents, null, 2));
    console.log('students.json file created successfully.');
  }
} catch (err) {
  console.error('Error creating students.json:', err);
}

try {
  if (!fs.existsSync(teachersFile)) {
    console.log('Creating teachers.json file...');
    fs.writeFileSync(teachersFile, JSON.stringify([]));
    console.log('teachers.json file created successfully.');
  }
} catch (err) {
  console.error('Error creating teachers.json:', err);
}

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// Helper functions to read/write data
const readData = (file) => {
  try {
    if (!fs.existsSync(file)) {
      console.log(`File not found: ${file}`);
      return file === studentsFile ? {} : [];
    }
    const data = fs.readFileSync(file, 'utf8');
    console.log(`Successfully read file: ${file}`);
    return JSON.parse(data);
  } catch (err) {
    console.error(`Error reading ${file}:`, err);
    return file === studentsFile ? {} : [];
  }
};

const writeData = (file, data) => {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
    console.log(`Successfully wrote to file: ${file}`);
    return true;
  } catch (err) {
    console.error(`Error writing to ${file}:`, err);
    return false;
  }
};

// Authentication middleware
const isAuthenticated = (req, res, next) => {
  if (req.session.isAuthenticated) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

// Handle favicon.ico request
app.get('/favicon.ico', (req, res) => {
  res.status(204).end(); // No content response
});

// Routes
// Login
app.post('/api/login', (req, res) => {
  try {
    const { password } = req.body;
    const adminPassword = process.env.ADMIN_PASSWORD || '0987654321';
    
    console.log(`Login attempt with password: ${password}`);
    console.log(`Expected password: ${adminPassword}`);
    
    if (password === adminPassword) {
      req.session.isAuthenticated = true;
      console.log('Authentication successful');
      res.json({ success: true });
    } else {
      console.log('Authentication failed: wrong password');
      res.status(401).json({ error: 'Invalid password' });
    }
  } catch (err) {
    console.error('Error in /api/login:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout
app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// Students API
app.get('/api/students', (req, res) => {
  try {
    console.log('Request received for /api/students');
    const students = readData(studentsFile);
    console.log(`Sending ${Object.keys(students).length} students`);
    res.json(students);
  } catch (err) {
    console.error('Error in /api/students:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/students/:id', (req, res) => {
  try {
    const students = readData(studentsFile);
    const student = students[req.params.id];
    if (student) {
      res.json(student);
    } else {
      res.status(404).json({ error: 'Student not found' });
    }
  } catch (err) {
    console.error('Error in /api/students/:id:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/students', isAuthenticated, upload.single('photo'), (req, res) => {
  try {
    const students = readData(studentsFile);
    const newId = Object.keys(students).length > 0 ? Math.max(...Object.keys(students).map(Number)) + 1 : 1;
    
    const newStudent = {
      name: `${req.body.firstName} ${req.body.lastName}`,
      grade: `Grade ${req.body.grade}`,
      email: req.body.email,
      bio: req.body.bio || `A talented student in Grade ${req.body.grade}.`,
      image: req.file ? `/uploads/${req.file.filename}` : "https://images.unsplash.com/photo-1581093450021-4a7360e9a6b5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80",
      currentProject: {
        title: req.body.projectTitle,
        type: req.body.projectType,
        description: req.body.projectDesc,
        codingLanguage: req.body.codingLanguage
      },
      previousProjects: []
    };

    students[newId] = newStudent;
    if (writeData(studentsFile, students)) {
      res.json(newStudent);
    } else {
      res.status(500).json({ error: 'Failed to save student data' });
    }
  } catch (err) {
    console.error('Error in /api/students (POST):', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
