import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import session from 'express-session';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Demo users (in production, use a database!)
const users = {
    'admin': 'blueprint2026',
    'student': 'learn123',
    'demo': 'demo'
};

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'views')));
app.use(express.json());
app.use(session({
    secret: 'blueprint-atlas-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// Middleware to check if user is logged in
function requireLogin(req, res, next) {
    if (req.session && req.session.user) {
        next();
    } else {
        res.redirect('/atlas');
    }
}      

app.route('/').get((req, res) => {
    res.render('index');
});
app.route('/sponsors').get((req, res) => {
    res.render('sponsors');
});
app.route('/event').get((req, res) => {
    res.render('event');
});
app.route('/').get((req, res) => {
    res.render('index');
});

//Atlas 
app.route('/atlas').get((req, res) => {
    if (req.session && req.session.user) {
        res.redirect('/atlas/dashboard');
    } else {
        res.render('atlas-login');
    }
});

app.route('/atlas').post((req, res) => {
    const { username, password } = req.body;
    
    if (users[username] && users[username] === password) {
        req.session.user = username;
        res.json({ success: true });
    } else {
        res.json({ success: false, message: 'Invalid username or password' });
    }
});

app.route('/atlas/dashboard').get(requireLogin, (req, res) => {
    res.render('atlas-dashboard', { username: req.session.user });
});

app.route('/atlas/logout').get((req, res) => {
    req.session.destroy();
    res.redirect('/atlas');
});

// ──────────────────────────────────────────────────
// C++ Challenge Simulator
// ──────────────────────────────────────────────────
app.route('/cpp-simulator').get((req, res) => {
    res.render('cpp-simulator');
});

app.route('/cpp-challenge').get((req, res) => {
    res.render('cpp-challenge');
});

// Code execution proxy (Piston API)
app.post('/api/execute-code', async (req, res) => {
    try {
        const { code, input } = req.body;
        const response = await fetch('https://emkc.org/api/v2/piston/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                language: 'c++',
                version: '10.2.0',
                files: [{ content: code }],
                stdin: input || '',
                compile_timeout: 10000,
                run_timeout: 5000
            })
        });
        const data = await response.json();
        res.json(data);
    } catch (err) {
        console.error('Code execution error:', err.message);
        res.status(500).json({ error: 'Execution service unavailable' });
    }
});


app.listen(3000, () => {
    console.log('Server started on http://localhost:3000');
});