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

// Session configuration
app.use(session({
    secret: 'blueprint-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set to true in production with HTTPS
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
app.route('/atlas').get((req, res) => {
    res.render('atlas-auth');
});

app.post('/atlas-login', async (req, res) => {
    const { email, password } = req.body;
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });
    if (error) {
        return res.status(401).json({ error: error.message });
    }
    // Save user to session
    req.session.user = data.user;
    res.json({ success: true, user: data.user });
});

app.listen(3000, () => {
    console.log('Server started on http://localhost:3000');
});