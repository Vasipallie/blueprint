import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import session from 'express-session';
import cookieSession from 'cookie-session';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

const supalink = process.env.SUPABASE_URL || 'https://sdhkohnfkjiwxpxobbsh.supabase.co';
const supakey = process.env.SUPABASE_ANON_KEY || 'sb_publishable_kaDnJWHieAUn9eTfVSinLw_Rft2IJ8g';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const submissionsTable = process.env.SUPABASE_SUBMISSIONS_TABLE || 'submitted_projects';
const teamsTable = process.env.SUPABASE_TEAMS_TABLE || 'teams';
const coursesTable = process.env.SUPABASE_PROJECTS_TABLE || 'projects';
const teamMembersTable = process.env.SUPABASE_TEAM_MEMBERS_TABLE || 'team_members';
const memberOperationsTable = process.env.SUPABASE_MEMBER_OPERATIONS_TABLE || 'member_operations';
const adminSettingsTable = process.env.SUPABASE_ADMIN_SETTINGS_TABLE || 'admin_settings';
const attendanceSecret = process.env.ATTENDANCE_QR_SECRET || 'blueprint-attendance-secret';

const supabase = createClient(supalink, supakey);
const supabaseAdmin = supabaseServiceKey ? createClient(supalink, supabaseServiceKey) : null;

const FOOD_SESSIONS = [
    { id: 'day1_lunch', label: 'Day 1 Lunch' },
    { id: 'day1_snack', label: 'Day 1 Snack' },
    { id: 'day2_lunch', label: 'Day 2 Lunch' },
    { id: 'day2_snack', label: 'Day 2 Snack' }
];

const ATTENDANCE_SESSIONS = [
    { id: 'attendance_day1', label: 'Day 1 Attendance' },
    { id: 'attendance_day2', label: 'Day 2 Attendance' }
];


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const isVercel = Boolean(process.env.VERCEL);
const isProduction = process.env.NODE_ENV === 'production' || isVercel;

app.set('view engine', 'ejs');

if (isProduction) {
    app.set('trust proxy', 1);
}

app.use(express.static(path.join(__dirname, 'views')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const sessionSecret = process.env.SESSION_SECRET || 'blueprint-secret-key';

// Session middleware
// - Vercel is serverless: in-memory/file session stores are not reliable.
// - Use signed cookie sessions in that environment to prevent random logouts.
if (isVercel || process.env.SESSION_STRATEGY === 'cookie') {
    app.use(cookieSession({
        name: 'atlas.sid',
        keys: [sessionSecret],
        maxAge: 1000 * 60 * 60 * 8,
        sameSite: 'lax',
        secure: isProduction,
        httpOnly: true
    }));
} else {
    app.use(session({
        secret: sessionSecret,
        resave: false,
        saveUninitialized: false,
        proxy: isProduction,
        cookie: {
            secure: isProduction,
            sameSite: 'lax',
            maxAge: 1000 * 60 * 60 * 8,
            httpOnly: true
        }
    }));
}

function saveSession(req, callback) {
    if (typeof req.session?.save === 'function') {
        return req.session.save(callback);
    }
    callback(null);
}

function destroySession(req, callback) {
    if (typeof req.session?.destroy === 'function') {
        return req.session.destroy(callback);
    }

    req.session = null;
    callback();
}

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

function buildRandomPassword(teamName = '') {
    const prefix = String(teamName)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]/g, '')
        .slice(0, 3)
        .toLowerCase();
    const remaining = 6 - prefix.length;
    const max = Math.pow(10, remaining);
    const num = Math.floor(Math.random() * max).toString().padStart(remaining, '0');
    return prefix + num;
}

function sanitizeTeamHandle(teamName) {
    return String(teamName || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '.')
        .replace(/^\.+|\.+$/g, '')
        .replace(/\.{2,}/g, '.');
}

function getDefaultTeamEmailTemplates(teamName = '') {
    return {
        subject: `Blueprint Atlas Account for ${teamName || '{{TEAM_NAME}}'}`,
        body: [
            'Hello {{TEAM_NAME}},',
            '',
            'Your Atlas team account has been created.',
            '',
            'Email: {{TEAM_EMAIL}}',
            'Password: {{PASSWORD}}',
            '',
            'Please log in at: {{LOGIN_URL}}',
            '',
            'Regards,',
            'GIIS Robotics Club'
        ].join('\n')
    };
}

function applyTemplate(template, replacements) {
    return String(template || '').replace(/\{\{\s*([A-Z_]+)\s*\}\}/g, (_, key) => {
        const value = replacements[key];
        return value === null || value === undefined ? '' : String(value);
    });
}

async function getStoredTeamMailTemplates(teamName = '') {
    const defaults = getDefaultTeamEmailTemplates(teamName);

    try {
        const { data, error } = await supabase
            .from(adminSettingsTable)
            .select('value_json')
            .eq('key', 'team_onboarding_email_template')
            .maybeSingle();

        if (error) {
            if (error.code !== '42P01') {
                console.error('Template settings fetch error:', error.message);
            }
            return defaults;
        }

        const savedSubject = String(data?.value_json?.subject || '').trim();
        const savedBody = String(data?.value_json?.body || '').trim();

        return {
            subject: savedSubject || defaults.subject,
            body: savedBody || defaults.body
        };
    } catch (error) {
        console.error('Template settings fetch failed:', error.message);
        return defaults;
    }
}

async function saveStoredTeamMailTemplates(subject, body) {
    const payload = {
        key: 'team_onboarding_email_template',
        value_json: {
            subject,
            body
        },
        updated_at: new Date().toISOString()
    };

    const { error } = await supabase
        .from(adminSettingsTable)
        .upsert(payload, { onConflict: 'key' });

    if (error) {
        throw error;
    }
}

async function sendTeamAccountEmail({ teamName, teamEmail, password, recipients, subjectTemplate, bodyTemplate }) {
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

    const replacements = {
        TEAM_NAME: teamName,
        TEAM_EMAIL: teamEmail,
        PASSWORD: password,
        LOGIN_URL: process.env.ATLAS_LOGIN_URL || 'http://blueprint.giisrobotics.club/atlas'
    };

    const defaults = getDefaultTeamEmailTemplates(teamName);
    const subject = applyTemplate(subjectTemplate || defaults.subject, replacements);
    const textBody = applyTemplate(bodyTemplate || defaults.body, replacements);

    await transporter.sendMail({
        from: gmailUser,
        to: toList,
        cc: 'vasipallieshan@gmail.com',
        subject,
        text: textBody
    });
}

function normalizeString(value) {
    return String(value || '').trim().toLowerCase();
}

function pickFirstValue(row, keys) {
    for (const key of keys) {
        const value = row?.[key];
        if (value !== null && value !== undefined && String(value).trim()) {
            return String(value).trim();
        }
    }
    return '';
}

function extractMemberNames(teamRow) {
    const keys = Object.keys(teamRow || {});
    const memberNames = [];

    for (const key of keys) {
        if (!/member|participant|student/i.test(key)) {
            continue;
        }

        const value = teamRow[key];
        if (!value) {
            continue;
        }

        if (Array.isArray(value)) {
            value.forEach((item) => {
                if (item && String(item).trim()) {
                    memberNames.push(String(item).trim());
                }
            });
            continue;
        }

        if (typeof value === 'object') {
            Object.values(value).forEach((item) => {
                if (item && String(item).trim()) {
                    memberNames.push(String(item).trim());
                }
            });
            continue;
        }

        const text = String(value).trim();
        if (!text) {
            continue;
        }

        if (text.includes(',')) {
            text.split(',').map((item) => item.trim()).filter(Boolean).forEach((item) => memberNames.push(item));
        } else {
            memberNames.push(text);
        }
    }

    return Array.from(new Set(memberNames));
}

function buildTeamKey(teamRow) {
    return String(teamRow.user_id || teamRow.id || teamRow.team_name || teamRow.name || '');
}

function buildTeamSummary(teamRow) {
    const teamName = pickFirstValue(teamRow, ['team_name', 'name']) || 'Unnamed Team';
    const allegiance = pickFirstValue(teamRow, ['allegiance', 'allegens', 'house', 'group']);
    const rowId = buildTeamKey(teamRow) || teamName;

    return {
        teamId: rowId,
        userId: teamRow.user_id || null,
        teamName,
        teamEmail: pickFirstValue(teamRow, ['team_email', 'email']),
        allegiance
    };
}

function buildMemberSummary(memberRow, teamSummary) {
    const allegiance = pickFirstValue(memberRow, ['allegiance', 'allegens', 'house', 'group']) || teamSummary.allegiance;

    return {
        memberId: String(memberRow.id),
        teamId: String(memberRow.team_id || teamSummary.teamId),
        memberName: pickFirstValue(memberRow, ['member_name', 'name']) || 'Unnamed Member',
        allegiance
    };
}

function teamMatchesQuery(teamSummary, members, queryText) {
    if (!queryText) {
        return true;
    }

    const haystack = [
        teamSummary.teamName,
        teamSummary.teamEmail,
        teamSummary.allegiance,
        ...members.map((member) => [member.memberName, member.allegiance].join(' '))
    ].join(' ').toLowerCase();

    return haystack.includes(queryText);
}

function buildAttendanceToken(memberId) {
    const signature = crypto
        .createHmac('sha256', attendanceSecret)
        .update(memberId)
        .digest('hex')
        .slice(0, 16);

    return `${memberId}.${signature}`;
}

function verifyAttendanceToken(token) {
    const [memberId, signature] = String(token || '').split('.');

    if (!memberId || !signature) {
        return null;
    }

    const expected = crypto
        .createHmac('sha256', attendanceSecret)
        .update(memberId)
        .digest('hex')
        .slice(0, 16);

    if (signature !== expected) {
        return null;
    }

    return memberId;
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

app.route('/sim').get((req, res) => {
    res.render('sim');
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

        // Keep cookie sessions small (serverless-friendly). Do not store the full Supabase user object.
        req.session.user = {
            id: data.user.id,
            email: data.user.email,
            user_metadata: data.user.user_metadata,
            app_metadata: data.user.app_metadata
        };

        // Only store access tokens in server-side sessions.
        if (typeof req.session?.save === 'function') {
            req.session.accessToken = data.session?.access_token || null;
        }
        req.session.isAdmin = isAdmin;

        return saveSession(req, (saveError) => {
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
    destroySession(req, () => {
        res.clearCookie('connect.sid');
        res.clearCookie('atlas.sid');
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
            cc: 'vasipallieshan@gmail.com',
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

app.get('/admin/teams', requireAdmin, async (req, res) => {
    let teams = [];
    let defaultTeamMailTemplates = getDefaultTeamEmailTemplates();

    try {
        const { data, error } = await supabase
            .from(teamsTable)
            .select('*')
            .order('team_name', { ascending: true })
            .limit(500);

        if (error) {
            console.error('Admin teams fetch error:', error.message);
        } else {
            teams = (data || []).map((row) => {
                const summary = buildTeamSummary(row);
                return {
                    teamId: summary.teamId,
                    teamName: summary.teamName,
                    teamEmail: summary.teamEmail
                };
            });
        }
    } catch (error) {
        console.error('Admin teams fetch failed:', error.message);
    }

    defaultTeamMailTemplates = await getStoredTeamMailTemplates();

    res.render('admin-teams', {
        user: req.session.user,
        hasServiceRole: Boolean(supabaseAdmin),
        query: req.query,
        teams,
        teamMembersTable,
        defaultTeamMailTemplates
    });
});

app.post('/admin/teams/email-template', requireAdmin, async (req, res) => {
    const subject = String(req.body?.emailSubject || '').trim();
    const body = String(req.body?.emailBody || '').trim();

    if (!subject || !body) {
        return res.redirect('/admin/teams?template=missing');
    }

    try {
        await saveStoredTeamMailTemplates(subject, body);
        return res.redirect('/admin/teams?template=saved');
    } catch (error) {
        if (error.code === '42P01') {
            return res.redirect('/admin/teams?template=table-missing');
        }
        console.error('Template save failed:', error.message);
        return res.redirect('/admin/teams?template=error');
    }
});

app.post('/admin/teams/members', requireAdmin, async (req, res) => {
    const teamId = String(req.body?.teamId || '').trim();
    const allegiance = String(req.body?.allegiance || '').trim();
    const membersRaw = String(req.body?.members || '').trim();

    if (!teamId || !membersRaw) {
        return res.redirect('/admin/teams?member=missing');
    }

    const memberNames = membersRaw
        .split(/\r?\n|,/)
        .map((item) => item.trim())
        .filter(Boolean);

    if (!memberNames.length) {
        return res.redirect('/admin/teams?member=missing');
    }

    try {
        const { data: teamRows, error: teamError } = await supabase
            .from(teamsTable)
            .select('*')
            .or(`user_id.eq.${teamId},id.eq.${teamId}`)
            .limit(1);

        if (teamError) {
            return res.redirect('/admin/teams?member=error');
        }

        const teamRow = (teamRows || [])[0];
        if (!teamRow) {
            return res.redirect('/admin/teams?member=team-not-found');
        }

        const payload = memberNames.map((memberName) => ({
            team_id: teamId,
            member_name: memberName,
            allegiance: allegiance || null
        }));

        const { error } = await supabase
            .from(teamMembersTable)
            .upsert(payload, { onConflict: 'team_id,member_name' });

        if (error) {
            if (error.code === '42P01') {
                return res.redirect('/admin/teams?member=table-missing');
            }
            console.error('Team members insert error:', error.message);
            return res.redirect('/admin/teams?member=error');
        }

        return res.redirect('/admin/teams?member=added');
    } catch (error) {
        console.error('Team members insert failed:', error.message);
        return res.redirect('/admin/teams?member=error');
    }
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
    let subjectTemplate = String(req.body.emailSubject || '').trim();
    let bodyTemplate = String(req.body.emailBody || '').trim();

    if (!subjectTemplate || !bodyTemplate) {
        const stored = await getStoredTeamMailTemplates(teamName || '');
        subjectTemplate = subjectTemplate || stored.subject;
        bodyTemplate = bodyTemplate || stored.body;
    }

    if (!teamName) {
        return res.redirect('/admin/teams?create=missing-team');
    }

    const handle = sanitizeTeamHandle(teamName);
    if (!handle) {
        return res.redirect('/admin/teams?create=invalid-team');
    }

    const teamEmail = `${handle}@giisrobotics.club`;
    const password = buildRandomPassword(teamName);
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
            recipients,
            subjectTemplate,
            bodyTemplate
        });

        return res.redirect('/admin/teams?create=success');
    } catch (error) {
        console.error('Create team failed:', error.message);
        return res.redirect('/admin/teams?create=error');
    }
});

async function fetchMemberOperationsMap(memberIds) {
    if (!memberIds.length) {
        return { map: new Map(), tableMissing: false };
    }

    const { data, error } = await supabase
        .from(memberOperationsTable)
        .select('*')
        .in('member_id', memberIds);

    if (error) {
        const tableMissing = error.code === '42P01';
        if (!tableMissing) {
            console.error('Member operations fetch error:', error.message);
        }
        return { map: new Map(), tableMissing };
    }

    return {
        map: new Map((data || []).map((row) => [String(row.member_id), row])),
        tableMissing: false
    };
}

async function fetchMemberById(memberId) {
    const { data, error } = await supabase
        .from(teamMembersTable)
        .select('*')
        .eq('id', memberId)
        .maybeSingle();

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

function buildMemberOperationsPayload(teamSummary, memberSummary, patch) {
    return {
        member_id: memberSummary.memberId,
        team_id: teamSummary.teamId,
        team_name: teamSummary.teamName,
        team_email: teamSummary.teamEmail,
        member_name: memberSummary.memberName,
        allegiance: memberSummary.allegiance,
        ...patch,
        updated_at: new Date().toISOString()
    };
}

function buildMemberWithStatuses(memberSummary, statusRow = {}) {
    return {
        ...memberSummary,
        food: {
            day1_lunch: Boolean(statusRow.day1_lunch),
            day1_snack: Boolean(statusRow.day1_snack),
            day2_lunch: Boolean(statusRow.day2_lunch),
            day2_snack: Boolean(statusRow.day2_snack)
        },
        attendance: {
            attendance_day1: Boolean(statusRow.attendance_day1),
            attendance_day2: Boolean(statusRow.attendance_day2)
        },
        attendanceToken: buildAttendanceToken(memberSummary.memberId)
    };
}

async function fetchTeamMapByIds(teamIds) {
    if (!teamIds.length) {
        return new Map();
    }

    const orFilter = teamIds
        .flatMap((teamId) => [`user_id.eq.${teamId}`, `id.eq.${teamId}`])
        .join(',');

    const { data, error } = await supabase
        .from(teamsTable)
        .select('*')
        .or(orFilter);

    if (error) {
        throw new Error(error.message);
    }

    const map = new Map();
    (data || []).forEach((row) => {
        const summary = buildTeamSummary(row);
        map.set(summary.teamId, summary);
    });

    return map;
}

app.get('/admin/operations', requireAdmin, (req, res) => {
    res.render('admin-operations', {
        user: req.session.user,
        foodSessions: FOOD_SESSIONS,
        attendanceSessions: ATTENDANCE_SESSIONS,
        teamMembersTable,
        memberOperationsTable
    });
});

app.get('/api/admin/operations/search', requireAdmin, async (req, res) => {
    const q = normalizeString(req.query.q);

    try {
        const { data, error } = await supabase
            .from(teamsTable)
            .select('*')
            .limit(500);

        if (error) {
            return res.status(500).json({ success: false, message: error.message });
        }

        const teamSummaries = (data || []).map(buildTeamSummary);
        const teamIds = teamSummaries.map((team) => team.teamId).filter(Boolean);

        const { data: membersData, error: membersError } = await supabase
            .from(teamMembersTable)
            .select('*')
            .in('team_id', teamIds)
            .limit(3000);

        if (membersError) {
            const isTableMissing = membersError.code === '42P01';
            return res.status(500).json({
                success: false,
                message: isTableMissing
                    ? `Table ${teamMembersTable} is missing. Create it before searching members.`
                    : membersError.message
            });
        }

        const membersByTeamId = new Map();
        (membersData || []).forEach((row) => {
            const key = String(row.team_id || '');
            if (!membersByTeamId.has(key)) {
                membersByTeamId.set(key, []);
            }
            membersByTeamId.get(key).push(row);
        });

        const allMemberIds = (membersData || []).map((row) => String(row.id));
        const { map: statusMap, tableMissing } = await fetchMemberOperationsMap(allMemberIds);

        const teams = teamSummaries
            .map((team) => {
                const members = (membersByTeamId.get(team.teamId) || [])
                    .map((memberRow) => buildMemberSummary(memberRow, team))
                    .map((member) => buildMemberWithStatuses(member, statusMap.get(member.memberId)));

                return {
                    ...team,
                    members
                };
            })
            .filter((team) => teamMatchesQuery(team, team.members, q))
            .slice(0, 100);

        return res.json({
            success: true,
            teams,
            tableMissing,
            qrBasePath: '/attendance/scan/'
        });
    } catch (error) {
        console.error('Operations search failed:', error.message);
        return res.status(500).json({ success: false, message: 'Failed to search teams.' });
    }
});

app.post('/api/admin/operations/food', requireAdmin, async (req, res) => {
    const memberId = String(req.body?.memberId || '').trim();
    const sessionId = String(req.body?.sessionId || '').trim();

    if (!memberId || !FOOD_SESSIONS.some((item) => item.id === sessionId)) {
        return res.status(400).json({ success: false, message: 'Invalid member or food session.' });
    }

    try {
        const memberRow = await fetchMemberById(memberId);
        if (!memberRow) {
            return res.status(404).json({ success: false, message: 'Member not found.' });
        }

        const teamMap = await fetchTeamMapByIds([String(memberRow.team_id)]);
        const team = teamMap.get(String(memberRow.team_id));

        if (!team) {
            return res.status(404).json({ success: false, message: 'Team not found for member.' });
        }

        const member = buildMemberSummary(memberRow, team);
        const { map: statusMap, tableMissing } = await fetchMemberOperationsMap([member.memberId]);

        if (tableMissing) {
            return res.status(500).json({
                success: false,
                message: `Table ${memberOperationsTable} is missing. Create it before marking food collection.`
            });
        }

        const current = statusMap.get(member.memberId) || {};
        const alreadyCollected = Boolean(current[sessionId]);
        const payload = buildMemberOperationsPayload(team, member, { [sessionId]: true });

        const { error } = await supabase
            .from(memberOperationsTable)
            .upsert(payload, { onConflict: 'member_id' });

        if (error) {
            return res.status(500).json({ success: false, message: error.message });
        }

        return res.json({
            success: true,
            alreadyCollected,
            member: buildMemberWithStatuses(member, { ...current, [sessionId]: true })
        });
    } catch (error) {
        console.error('Food mark failed:', error.message);
        return res.status(500).json({ success: false, message: 'Failed to mark food collection.' });
    }
});

app.post('/api/admin/operations/attendance/manual', requireAdmin, async (req, res) => {
    const sessionId = String(req.body?.sessionId || '').trim();
    const memberIds = Array.isArray(req.body?.memberIds)
        ? req.body.memberIds.map((item) => String(item || '').trim()).filter(Boolean)
        : [];

    if (!ATTENDANCE_SESSIONS.some((item) => item.id === sessionId) || !memberIds.length) {
        return res.status(400).json({ success: false, message: 'Choose a valid attendance session and at least one member.' });
    }

    try {
        const { data, error } = await supabase
            .from(teamMembersTable)
            .select('*')
            .in('id', memberIds);

        if (error) {
            return res.status(500).json({ success: false, message: error.message });
        }

        const members = data || [];
        const uniqueTeamIds = Array.from(new Set(members.map((member) => String(member.team_id || '')).filter(Boolean)));
        const teamMap = await fetchTeamMapByIds(uniqueTeamIds);

        const payload = members
            .map((memberRow) => {
                const team = teamMap.get(String(memberRow.team_id));
                if (!team) {
                    return null;
                }
                const member = buildMemberSummary(memberRow, team);
                return buildMemberOperationsPayload(team, member, { [sessionId]: true });
            })
            .filter(Boolean);

        const { error: upsertError } = await supabase
            .from(memberOperationsTable)
            .upsert(payload, { onConflict: 'member_id' });

        if (upsertError) {
            return res.status(500).json({ success: false, message: upsertError.message });
        }

        return res.json({ success: true, updated: payload.length });
    } catch (error) {
        console.error('Manual attendance failed:', error.message);
        return res.status(500).json({ success: false, message: 'Failed to update manual attendance.' });
    }
});

app.get('/attendance/scan/:token', async (req, res) => {
    const token = String(req.params.token || '');
    const sessionId = String(req.query?.session || '').trim();

    if (!ATTENDANCE_SESSIONS.some((item) => item.id === sessionId)) {
        return res.status(400).send('Invalid attendance session.');
    }

    const memberId = verifyAttendanceToken(token);
    if (!memberId) {
        return res.status(400).send('Invalid or expired QR token.');
    }

    try {
        const memberRow = await fetchMemberById(memberId);
        if (!memberRow) {
            return res.status(404).send('Member not found for this QR token.');
        }

        const teamMap = await fetchTeamMapByIds([String(memberRow.team_id)]);
        const team = teamMap.get(String(memberRow.team_id));

        if (!team) {
            return res.status(404).send('Team not found for this member.');
        }

        const member = buildMemberSummary(memberRow, team);
        const payload = buildMemberOperationsPayload(team, member, { [sessionId]: true });

        const { error } = await supabase
            .from(memberOperationsTable)
            .upsert(payload, { onConflict: 'member_id' });

        if (error) {
            return res.status(500).send(`Attendance update failed: ${error.message}`);
        }

        return res.send(`Attendance marked for ${member.memberName} from ${team.teamName} (${sessionId.replace('_', ' ')}).`);
    } catch (error) {
        console.error('QR attendance failed:', error.message);
        return res.status(500).send('Failed to mark attendance from QR scan.');
    }
});


app.listen(3000, () => {
    console.log('Server started on http://localhost:3000');
});