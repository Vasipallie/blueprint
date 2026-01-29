import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import session from 'express-session';
import { createClient } from '@supabase/supabase-js';

// Supabase setup
const supalink="https://sdhkohnfkjiwxpxobbsh.supabase.co"
const supakey="sb_publishable_kaDnJWHieAUn9eTfVSinLw_Rft2IJ8g"
const supabase = createClient(supalink, supakey); 


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'views')));
app.use(express.json());

// Session middleware
app.use(session({
    secret: 'blueprint-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set to true if using HTTPS
}));

// Middleware to check if user is logged in
function requireLogin(req, res, next) {
    if (!req.session.user) {
        return res.redirect('/atlas');
    }
    next();
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
app.route('/dashboard').get(requireLogin, (req, res) => {
    res.render('atlas-dashboard', { user: req.session.user });
}
);
app.route('/atlas').get((req, res) => {
    try {
        const user = req.session.user;
        if (user) {
            return res.redirect('/dashboard');
        }
    } catch (error) {
        console.error('Error checking session:', error);
    }
    res.render('atlas');
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error || !data.user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        req.session.user = data.user;
        res.redirect('/dashboard');
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


app.listen(3000, () => {
    console.log('Server started on http://localhost:3000');
});