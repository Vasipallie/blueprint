import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import session from 'express-session';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

const supalink = process.env.SUPABASE_URL || 'https://sdhkohnfkjiwxpxobbsh.supabase.co';
const supakey = process.env.SUPABASE_ANON_KEY || 'sb_publishable_kaDnJWHieAUn9eTfVSinLw_Rft2IJ8g';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const submissionsTable = process.env.SUPABASE_SUBMISSIONS_TABLE || 'submitted_projects';
const teamsTable = process.env.SUPABASE_TEAMS_TABLE || 'teams';
const coursesTable = process.env.SUPABASE_PROJECTS_TABLE || 'projects';

const supabase = createClient(supalink, supakey);
const supabaseAdmin = supabaseServiceKey ? createClient(supalink, supabaseServiceKey) : null;


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'views')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware
app.use(session({
    secret: process.env.SESSION_SECRET || 'blueprint-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 8
    }
}));

function requireLogin(req, res, next) {
    if (!req.session.user) {
        return res.redirect('/atlas');
    }
    next();
}

function isAdminFromProfile(user) {
    const adminEmails = (process.env.ADMIN_EMAILS || '')
        .split(',')
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean);

    const email = user?.email?.toLowerCase();
    const metadataRole = user?.user_metadata?.role || user?.app_metadata?.role;

    if (metadataRole === 'admin') {
        return true;
    }

    return email ? adminEmails.includes(email) : false;
}

async function resolveAdminStatus(user) {
    if (!user) {
        return false;
    }

    if (isAdminFromProfile(user)) {
        return true;
    }

    try {
        const { data, error } = await supabase
            .from(teamsTable)
            .select('admin')
            .or(`user_id.eq.${user.id},team_email.eq.${user.email}`)
            .maybeSingle();

        if (error) {
            console.error('Admin lookup error:', error.message);
            return false;
        }

        return Boolean(data?.admin);
    } catch (error) {
        console.error('Admin lookup failed:', error.message);
        return false;
    }
}

async function requireAdmin(req, res, next) {
    if (!req.session.user) {
        return res.redirect('/atlas');
    }

    const isAdmin = await resolveAdminStatus(req.session.user);

    req.session.isAdmin = isAdmin;

    if (!isAdmin) {
        return res.redirect('/dashboard');
    }

    next();
}

function wantsJson(req) {
    const acceptHeader = req.headers.accept || '';
    return req.is('application/json') || acceptHeader.includes('application/json');
}

async function resolveTeamName(user) {
    const metadataName = user?.user_metadata?.team_name || user?.user_metadata?.full_name;
    if (metadataName) {
        return metadataName;
    }

    try {
        const { data } = await supabase
            .from(teamsTable)
            .select('team_name')
            .eq('user_id', user.id)
            .maybeSingle();

        if (data?.team_name) {
            return data.team_name;
        }
    } catch (error) {
        console.error('Team lookup failed:', error.message);
    }

    if (user?.email) {
        return user.email.split('@')[0];
    }

    return 'Team';
}

function buildRandomPassword(length = 14) {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
    const bytes = crypto.randomBytes(length);
    return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join('');
}

function sanitizeTeamHandle(teamName) {
    return String(teamName || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '.')
        .replace(/^\.+|\.+$/g, '')
        .replace(/\.{2,}/g, '.');
}

async function sendTeamAccountEmail({ teamName, teamEmail, password, recipients }) {
    const gmailUser = process.env.GMAIL_USER;
    const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

    if (!gmailUser || !gmailAppPassword) {
        throw new Error('Gmail credentials are not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD.');
    }

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: gmailUser,
            pass: gmailAppPassword
        }
    });

    const toList = recipients?.length ? recipients.join(', ') : teamEmail;

    await transporter.sendMail({
        from: gmailUser,
        to: toList,
        subject: `Blueprint Atlas Account for ${teamName}`,
        text: `Hello ${teamName},\n\nYour Atlas team account has been created.\n\nEmail: ${teamEmail}\nPassword: ${password}\n\nPlease log in at: http://blueprint.giisrobotics.club/atlas\n\nRegards,\nGIIS Robotics Club`
    });
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

app.route('/atlas').get(async (req, res) => {
    try {
        const user = req.session.user;
        if (user) {
            const isAdmin = await resolveAdminStatus(user);

            req.session.isAdmin = isAdmin;

            return res.redirect(isAdmin ? '/admin' : '/dashboard');
        }
    } catch (error) {
        console.error('Error checking session:', error);
    }
    res.render('atlas');
});

app.post('/login', async (req, res) => {
    const email = String(req.body?.email || '').trim();
    const password = String(req.body?.password || '');

    if (!email || !password) {
        if (wantsJson(req)) {
            return res.status(400).json({ success: false, message: 'Email and password are required' });
        }
        return res.redirect('/atlas?error=missing');
    }

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error || !data.user) {
            if (wantsJson(req)) {
                return res.status(401).json({ success: false, message: 'Invalid credentials' });
            }
            return res.redirect('/atlas?error=invalid');
        }

        const isAdmin = await resolveAdminStatus(data.user);

        req.session.user = data.user;
        req.session.accessToken = data.session?.access_token || null;
        req.session.isAdmin = isAdmin;

        return req.session.save((saveError) => {
            if (saveError) {
                console.error('Session save error:', saveError.message);
                if (wantsJson(req)) {
                    return res.status(500).json({ success: false, message: 'Session error. Please try again.' });
                }
                return res.redirect('/atlas?error=session');
            }

            if (wantsJson(req)) {
                return res.json({ success: true, redirect: '/dashboard' });
            }

            return res.redirect('/dashboard');
        });
    } catch (error) {
        console.error('Login error:', error);

        if (wantsJson(req)) {
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }

        return res.redirect('/atlas?error=server');
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.clearCookie('connect.sid');
        res.redirect('/atlas');
    });
});

app.get('/dashboard', requireLogin, async (req, res) => {
    const user = req.session.user;
    const isAdmin = await resolveAdminStatus(user);

    req.session.isAdmin = isAdmin;

    if (isAdmin) {
        return res.redirect('/admin');
    }

    const teamName = await resolveTeamName(user);

    let courses = [];
    let submissions = [];

    try {
        const { data, error } = await supabase
            .from(coursesTable)
            .select('*')
            .order('id', { ascending: true });

        if (error) {
            console.error('Courses fetch error:', error.message);
        } else {
            courses = data || [];
        }
    } catch (error) {
        console.error('Courses fetch failed:', error.message);
    }

    try {
        const { data, error } = await supabase
            .from(submissionsTable)
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(10);

        if (error) {
            console.error('Submissions fetch error:', error.message);
        } else {
            submissions = data || [];
        }
    } catch (error) {
        console.error('Submissions fetch failed:', error.message);
    }

    res.render('atlas-dashboard', {
        user,
        teamName,
        courses,
        submissions,
        query: req.query,
        isAdmin
    });
});

app.get('/dashboard/course/:id', requireLogin, async (req, res) => {
    const user = req.session.user;
    const isAdmin = await resolveAdminStatus(user);

    req.session.isAdmin = isAdmin;

    if (isAdmin) {
        return res.redirect('/admin');
    }

    const teamName = await resolveTeamName(user);
    const courseId = Number(req.params.id);

    if (!courseId || Number.isNaN(courseId)) {
        return res.redirect('/dashboard');
    }

    try {
        const { data, error } = await supabase
            .from(coursesTable)
            .select('*')
            .eq('id', courseId)
            .maybeSingle();

        if (error || !data) {
            return res.redirect('/dashboard?course=not-found');
        }

        return res.render('atlas-course', {
            user,
            teamName,
            course: data
        });
    } catch (error) {
        console.error('Course fetch failed:', error.message);
        return res.redirect('/dashboard?course=error');
    }
});

app.post('/dashboard/projects', requireLogin, async (req, res) => {
    const user = req.session.user;
    const teamName = await resolveTeamName(user);

    const projectName = req.body.projectName?.trim();
    const githubRepository = req.body.githubRepository?.trim();
    const pitchDeckLink = req.body.pitchDeckLink?.trim();
    const projectDescription = req.body.projectDescription?.trim();

    if (!projectName || !githubRepository || !pitchDeckLink || !projectDescription) {
        return res.redirect('/dashboard?submit=missing');
    }

    const payload = {
        user_id: user.id,
        team_name: teamName,
        team_email: user.email,
        project_name: projectName,
        github_repository: githubRepository,
        pitch_deck_link: pitchDeckLink,
        project_description: projectDescription
    };

    try {
        const { error } = await supabase
            .from(submissionsTable)
            .insert(payload);

        if (error) {
            console.error('Project submission error:', error.message);
            return res.redirect('/dashboard?submit=error');
        }

        return res.redirect('/dashboard?submit=success');
    } catch (error) {
        console.error('Project submission failed:', error.message);
        return res.redirect('/dashboard?submit=error');
    }
});

app.get('/admin/courses', requireAdmin, async (req, res) => {
    let courses = [];

    try {
        const { data, error } = await supabase
            .from(coursesTable)
            .select('*')
            .order('id', { ascending: true });

        if (error) {
            console.error('Admin courses fetch error:', error.message);
        } else {
            courses = data || [];
        }
    } catch (error) {
        console.error('Admin courses fetch failed:', error.message);
    }

    res.render('admin-course-editor', {
        user: req.session.user,
        courses,
        query: req.query
    });
});

app.post('/admin/courses', requireAdmin, async (req, res) => {
    const courseId = req.body.courseId ? Number(req.body.courseId) : null;
    const name = String(req.body.name || '').trim();
    const description = String(req.body.description || '').trim();
    const htmlContent = String(req.body.htmlContent || '').trim();

    if (!name || !description) {
        return res.redirect('/admin/courses?save=missing');
    }

    const payload = {
        name,
        description,
        html_content: htmlContent || '<p></p>'
    };

    try {
        if (courseId && !Number.isNaN(courseId)) {
            const { error } = await supabase
                .from(coursesTable)
                .update(payload)
                .eq('id', courseId);

            if (error) {
                console.error('Course update error:', error.message);
                return res.redirect('/admin/courses?save=error');
            }

            return res.redirect('/admin/courses?save=updated');
        }

        const { error } = await supabase
            .from(coursesTable)
            .insert(payload);

        if (error) {
            console.error('Course create error:', error.message);
            return res.redirect('/admin/courses?save=error');
        }

        return res.redirect('/admin/courses?save=created');
    } catch (error) {
        console.error('Course save failed:', error.message);
        return res.redirect('/admin/courses?save=error');
    }
});

app.post('/admin/courses/delete', requireAdmin, async (req, res) => {
    const courseId = req.body.courseId ? Number(req.body.courseId) : null;

    if (!courseId || Number.isNaN(courseId)) {
        return res.redirect('/admin/courses?save=invalid-delete');
    }

    try {
        const { error } = await supabase
            .from(coursesTable)
            .delete()
            .eq('id', courseId);

        if (error) {
            console.error('Course delete error:', error.message);
            return res.redirect('/admin/courses?save=delete-error');
        }

        return res.redirect('/admin/courses?save=deleted');
    } catch (error) {
        console.error('Course delete failed:', error.message);
        return res.redirect('/admin/courses?save=delete-error');
    }
});

app.get('/admin/emails', requireAdmin, (req, res) => {
    res.render('admin-email-editor', {
        user: req.session.user,
        query: req.query
    });
});

app.post('/admin/emails/send', requireAdmin, async (req, res) => {
    const recipientsRaw = String(req.body.recipients || '').trim();
    const subject = String(req.body.subject || '').trim();
    const htmlContent = String(req.body.htmlContent || '').trim();

    if (!recipientsRaw || !subject || !htmlContent) {
        return res.redirect('/admin/emails?mail=missing');
    }

    const gmailUser = process.env.GMAIL_USER;
    const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

    if (!gmailUser || !gmailAppPassword) {
        return res.redirect('/admin/emails?mail=gmail-missing');
    }

    const recipients = recipientsRaw
        .split(',')
        .map((email) => email.trim())
        .filter(Boolean);

    if (!recipients.length) {
        return res.redirect('/admin/emails?mail=missing');
    }

    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: gmailUser,
                pass: gmailAppPassword
            }
        });

        const textContent = htmlContent.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

        await transporter.sendMail({
            from: gmailUser,
            to: recipients.join(', '),
            subject,
            text: textContent || 'Please view this message in an HTML-capable email client.',
            html: htmlContent
        });

        return res.redirect('/admin/emails?mail=sent');
    } catch (error) {
        console.error('Admin email send failed:', error.message);
        return res.redirect('/admin/emails?mail=error');
    }
});

app.get('/admin', requireAdmin, async (req, res) => {
    let teamCount = 0;
    let courseCount = 0;
    let submissionCount = 0;

    try {
        const [{ count: teamsCount }, { count: coursesCount }, { count: submissionsCount }] = await Promise.all([
            supabase.from(teamsTable).select('*', { count: 'exact', head: true }),
            supabase.from(coursesTable).select('*', { count: 'exact', head: true }),
            supabase.from(submissionsTable).select('*', { count: 'exact', head: true })
        ]);

        teamCount = teamsCount || 0;
        courseCount = coursesCount || 0;
        submissionCount = submissionsCount || 0;
    } catch (error) {
        console.error('Admin summary fetch failed:', error.message);
    }

    res.render('admin-dashboard', {
        user: req.session.user,
        teamCount,
        courseCount,
        submissionCount
    });
});

app.get('/admin/teams', requireAdmin, (req, res) => {
    res.render('admin-teams', {
        user: req.session.user,
        hasServiceRole: Boolean(supabaseAdmin),
        query: req.query
    });
});

app.get('/admin/submissions', requireAdmin, async (req, res) => {
    let submittedProjects = [];

    try {
        const { data, error } = await supabase
            .from(submissionsTable)
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);

        if (error) {
            console.error('Admin submissions fetch error:', error.message);
        } else {
            submittedProjects = data || [];
        }
    } catch (error) {
        console.error('Admin submissions fetch failed:', error.message);
    }

    res.render('admin-submissions', {
        user: req.session.user,
        submittedProjects
    });
});

app.post('/admin/create-team', requireAdmin, async (req, res) => {
    if (!supabaseAdmin) {
        return res.redirect('/admin/teams?create=service-key-missing');
    }

    const teamName = req.body.teamName?.trim();
    const recipientsRaw = req.body.recipients?.trim();

    if (!teamName) {
        return res.redirect('/admin/teams?create=missing-team');
    }

    const handle = sanitizeTeamHandle(teamName);
    if (!handle) {
        return res.redirect('/admin/teams?create=invalid-team');
    }

    const teamEmail = `${handle}@giisrobotics.club`;
    const password = buildRandomPassword();
    const recipients = (recipientsRaw || '')
        .split(',')
        .map((email) => email.trim())
        .filter(Boolean);

    try {
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
            email: teamEmail,
            password,
            email_confirm: true,
            user_metadata: {
                team_name: teamName,
                role: 'team'
            }
        });

        if (error) {
            console.error('Team account create error:', error.message);
            return res.redirect('/admin/teams?create=error');
        }

        try {
            await supabase
                .from(teamsTable)
                .insert({
                    user_id: data.user.id,
                    team_name: teamName,
                    team_email: teamEmail,
                    admin: false
                });
        } catch (error) {
            console.error('Teams table insert warning:', error.message);
        }

        await sendTeamAccountEmail({
            teamName,
            teamEmail,
            password,
            recipients
        });

        return res.redirect('/admin/teams?create=success');
    } catch (error) {
        console.error('Create team failed:', error.message);
        return res.redirect('/admin/teams?create=error');
    }
});


app.listen(3000, () => {
    console.log('Server started on http://localhost:3000');
});