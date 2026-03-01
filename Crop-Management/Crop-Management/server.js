const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/cropcare', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Schema Definitions
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String },
    password: { type: String, required: true },
    role: { type: String, required: true, enum: ['admin', 'farmer'] },
    createdAt: { type: Date, default: Date.now }
});

const resourceSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    type: { type: String },
    category: { type: String },
    date: { type: Date }
});

const eventSchema = new mongoose.Schema({
    name: { type: String, required: true },
    location: { type: String, required: true },
    date: { type: String, required: true },
    type: { type: String },
    details: { type: String }
});

const mentorSchema = new mongoose.Schema({
    name: { type: String, required: true },
    expertise: { type: String, required: true },
    contact: { type: String, required: true }
});

const diseaseDetectionSchema = new mongoose.Schema({
    name: { type: String, required: true },
    details: { type: String, required: true }
});

const taskSchema = new mongoose.Schema({
    title: { type: String, required: true },
    schedule: { type: String, required: true },
    duration: { type: String, required: true },
    priority: { type: String, required: true },
    dueDate: { type: String, required: true },
    completed: { type: Boolean, default: false }
});

// Models
const User = mongoose.model('User', userSchema);
const Resource = mongoose.model('Resource', resourceSchema);
const Event = mongoose.model('Event', eventSchema);
const Mentor = mongoose.model('Mentor', mentorSchema);
const DiseaseDetection = mongoose.model('DiseaseDetection', diseaseDetectionSchema);
const Task = mongoose.model('Task', taskSchema);

// JWT Configuration
const JWT_SECRET = '91bef7f41bfa0ccd98848d7211f6f8059b209ae6338e60cc1074bc15a8fc43e5';

// Authentication Middleware
const authenticateToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ message: 'Access denied' });
    }

    try {
        const verified = jwt.verify(token, JWT_SECRET);
        req.user = verified;
        next();
    } catch (error) {
        res.status(400).json({ message: 'Invalid token' });
    }
};

// User Routes
app.post('/auth/register', async (req, res) => {
    try {
        const { username, password, email, role } = req.body;
        
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        
        const user = new User({
            username,
            email,
            password: hashedPassword,
            role: role || 'farmer'
        });

        await user.save();
        res.status(201).json({ message: 'Registration successful' });
    } catch (error) {
        res.status(500).json({ message: 'Error registering user' });
    }
});

app.post('/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { userId: user._id, username: user.username, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            username: user.username,
            role: user.role
        });
    } catch (error) {
        res.status(500).json({ message: 'Error during login' });
    }
});

// Resource Routes
app.get('/resources', async (req, res) => {
    try {
        const resources = await Resource.find();
        res.json(resources);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching resources' });
    }
});

app.post('/resources', authenticateToken, async (req, res) => {
    try {
        const resource = new Resource(req.body);
        await resource.save();
        res.status(201).json(resource);
    } catch (error) {
        res.status(500).json({ message: 'Error creating resource' });
    }
});

// Event Routes
app.get('/events', async (req, res) => {
    try {
        const events = await Event.find();
        res.json(events);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching events' });
    }
});

app.post('/events', authenticateToken, async (req, res) => {
    try {
        const event = new Event(req.body);
        await event.save();
        res.status(201).json(event);
    } catch (error) {
        res.status(500).json({ message: 'Error creating event' });
    }
});

// Mentor Routes
app.get('/mentors', async (req, res) => {
    try {
        const mentors = await Mentor.find();
        res.json(mentors);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching mentors' });
    }
});

app.post('/mentors', authenticateToken, async (req, res) => {
    try {
        const mentor = new Mentor(req.body);
        await mentor.save();
        res.status(201).json(mentor);
    } catch (error) {
        res.status(500).json({ message: 'Error creating mentor' });
    }
});

// Disease Detection Routes
app.get('/diseaseDetection', async (req, res) => {
    try {
        const diseases = await DiseaseDetection.find();
        res.json(diseases);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching diseases' });
    }
});

app.post('/diseaseDetection', authenticateToken, async (req, res) => {
    try {
        const disease = new DiseaseDetection(req.body);
        await disease.save();
        res.status(201).json(disease);
    } catch (error) {
        res.status(500).json({ message: 'Error creating disease entry' });
    }
});

// Task Routes
app.get('/tasks', async (req, res) => {
    try {
        const tasks = await Task.find();
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching tasks' });
    }
});

app.post('/tasks', authenticateToken, async (req, res) => {
    try {
        const task = new Task(req.body);
        await task.save();
        res.status(201).json(task);
    } catch (error) {
        res.status(500).json({ message: 'Error creating task' });
    }
});

app.patch('/tasks/:id', authenticateToken, async (req, res) => {
    try {
        const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(task);
    } catch (error) {
        res.status(500).json({ message: 'Error updating task' });
    }
});

// Server Setup
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});