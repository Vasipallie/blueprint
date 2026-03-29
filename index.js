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
const electronicsInventoryTable = process.env.SUPABASE_ELECTRONICS_INVENTORY_TABLE || 'electronics_inventory';
const electronicsLoansTable = process.env.SUPABASE_ELECTRONICS_LOANS_TABLE || 'electronics_loans';
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

const MAX_ACTIVE_LOANS_PER_TEAM = 2;
const LOANS_OPEN_AT_ISO = '2026-03-30T01:00:00.000Z'; // March 30, 2026 9:00 AM SGT
const LOANS_OPEN_MESSAGE = 'Loan requests are closed until March 30, 2026 9:00 AM SGT.';
const RETIRED_ELECTRONICS_SLUGS = new Set(['motor-driver', 'nfc-cards']);
const SOUND_SENSOR_IMAGE_URL = 'https://placehold.co/640x480/1e1222/f5d0ff?text=Sound+sensor';

let electronicsInventorySyncComplete = false;
let electronicsInventorySyncPromise = null;

const DEFAULT_ELECTRONICS_ITEMS = [
    { slug: 'lcd', name: 'LCD', category: 'Output', image_url: 'https://placehold.co/640x480/101820/f5eecf?text=LCD', total_stock: 8 },
    { slug: 'led-matrix', name: 'LED MATRIX', category: 'Output', image_url: 'https://placehold.co/640x480/0f1b2d/a7ffeb?text=LED+MATRIX', total_stock: 6 },
    { slug: 'water-sensor', name: 'Water sensor', category: 'Output', image_url: 'https://placehold.co/640x480/10263a/c7f9ff?text=Water+sensor', total_stock: 10 },
    { slug: 'relay', name: 'Relay', category: 'Output', image_url: 'https://placehold.co/640x480/2b1b0f/ffd9a3?text=Relay', total_stock: 12 },
    { slug: 'arduino', name: 'Arduino', category: 'Output', image_url: 'https://placehold.co/640x480/1f2a0f/f3ff9f?text=Arduino', total_stock: 10 },
    { slug: 'servo', name: 'Servo', category: 'Output', image_url: 'https://placehold.co/640x480/271433/f7d6ff?text=Servo', total_stock: 10 },
    { slug: 'rgb-light', name: 'RGB Light', category: 'Output', image_url: 'https://placehold.co/640x480/2a0f17/ffd1de?text=RGB+Light', total_stock: 10 },
    { slug: 'stepper-motor', name: 'Stepper motor', category: 'Output', image_url: 'https://placehold.co/640x480/0f2222/c9fff5?text=Stepper+motor', total_stock: 8 },
    { slug: '7-segment-display', name: '7 segment display', category: 'Output', image_url: 'https://placehold.co/640x480/1a0f25/e6c9ff?text=7+segment+display', total_stock: 12 },
    { slug: 'joystick', name: 'Joystick', category: 'Input', image_url: 'https://placehold.co/640x480/151515/ffe8a3?text=Joystick', total_stock: 10 },
    { slug: 'button-matrix', name: 'button matrix', category: 'Input', image_url: 'https://placehold.co/640x480/17253a/c2e6ff?text=button+matrix', total_stock: 10 },
    { slug: 'ir-sensor', name: 'ir sensor', category: 'Input', image_url: 'https://placehold.co/640x480/2a140f/ffcfbd?text=ir+sensor', total_stock: 10 },
    { slug: 'rfid', name: 'RFID', category: 'Input', image_url: 'https://placehold.co/640x480/0e2330/c3f3ff?text=RFID', total_stock: 10 },
    { slug: 'microphone', name: 'Sound sensor', category: 'Input', image_url: 'https://placehold.co/640x480/1e1222/f5d0ff?text=Sound+sensor', total_stock: 10 },
    { slug: 'humidity-sensor', name: 'Humidity sensor', category: 'Input', image_url: 'https://placehold.co/640x480/112a24/cbffe8?text=Humidity+sensor', total_stock: 10 },
    
];

const LOAN_ITEM_IMAGE_BY_SLUG = {
    arduino: '/resources/loans/arduino.jpg',
    'button-matrix': '/resources/loans/buttonmatrix.jpeg',
    'humidity-sensor': '/resources/loans/dht.png',
    joystick: '/resources/loans/joystick.jpg',
    lcd: '/resources/loans/lcd.jpg',
    'led-matrix': '/resources/loans/ledmatrix.jpeg',
    rfid: '/resources/loans/rfid.png'
};

function resolveLoanItemImageUrl(item) {
    const slug = String(item?.slug || '').trim().toLowerCase();
    return LOAN_ITEM_IMAGE_BY_SLUG[slug] || item?.image_url || '';
}

function isRetiredElectronicsItem(item) {
    const slug = String(item?.slug || '').trim().toLowerCase();
    return RETIRED_ELECTRONICS_SLUGS.has(slug);
}

function resolveLoanItemDisplayName(item) {
    const slug = String(item?.slug || '').trim().toLowerCase();
    if (slug === 'microphone') {
        return 'Sound sensor';
    }
    return String(item?.name || '');
}


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

async function fetchSensorKitFulfillmentMap() {
    try {
        const { data, error } = await supabase
            .from(adminSettingsTable)
            .select('value_json')
            .eq('key', 'sensor_kit_fulfillment')
            .maybeSingle();

        if (error) {
            if (error.code !== '42P01') {
                console.error('Sensor kit settings fetch error:', error.message);
            }
            return {};
        }

        const map = data?.value_json?.teams;
        if (!map || typeof map !== 'object') {
            return {};
        }

        return map;
    } catch (error) {
        console.error('Sensor kit settings fetch failed:', error.message);
        return {};
    }
}

async function markSensorKitFulfilled(teamSummary, fulfilledBy) {
    const existingMap = await fetchSensorKitFulfillmentMap();
    const nowIso = new Date().toISOString();

    const updatedMap = {
        ...existingMap,
        [teamSummary.teamId]: {
            fulfilled: true,
            fulfilledAt: nowIso,
            fulfilledBy: fulfilledBy || 'admin',
            teamName: teamSummary.teamName
        }
    };

    const payload = {
        key: 'sensor_kit_fulfillment',
        value_json: {
            teams: updatedMap
        },
        updated_at: nowIso
    };

    const { error } = await supabase
        .from(adminSettingsTable)
        .upsert(payload, { onConflict: 'key' });

    if (error) {
        throw error;
    }

    return updatedMap[teamSummary.teamId];
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

async function ensureElectronicsInventorySeeded() {
    if (electronicsInventorySyncComplete) {
        return;
    }

    if (electronicsInventorySyncPromise) {
        await electronicsInventorySyncPromise;
        return;
    }

    electronicsInventorySyncPromise = (async () => {
        const payload = DEFAULT_ELECTRONICS_ITEMS.map((item) => ({
            ...item,
            notes: 'Loan item. Must be returned.'
        }));

        const { error: upsertError } = await supabase
            .from(electronicsInventoryTable)
            .upsert(payload, { onConflict: 'slug' });

        if (upsertError) {
            throw upsertError;
        }

        const retiredSlugs = Array.from(RETIRED_ELECTRONICS_SLUGS);
        if (retiredSlugs.length > 0) {
            const { error: deleteRetiredError } = await supabase
                .from(electronicsInventoryTable)
                .delete()
                .in('slug', retiredSlugs);

            if (deleteRetiredError) {
                throw deleteRetiredError;
            }
        }

        const { error: renameError } = await supabase
            .from(electronicsInventoryTable)
            .update({
                name: 'Sound sensor',
                image_url: SOUND_SENSOR_IMAGE_URL
            })
            .eq('slug', 'microphone');

        if (renameError) {
            throw renameError;
        }

        electronicsInventorySyncComplete = true;
    })();

    try {
        await electronicsInventorySyncPromise;
    } finally {
        electronicsInventorySyncPromise = null;
    }
}

async function resolveTeamSummaryForUser(user) {
    const { data, error } = await supabase
        .from(teamsTable)
        .select('*')
        .or(`user_id.eq.${user.id},team_email.eq.${user.email}`)
        .limit(1);

    if (error) {
        throw error;
    }

    const row = (data || [])[0];
    if (row) {
        return buildTeamSummary(row);
    }

    return {
        teamId: String(user.id || user.email || ''),
        userId: user.id || null,
        teamName: await resolveTeamName(user),
        teamEmail: user.email || '',
        allegiance: ''
    };
}

function buildReservedMap(loans = []) {
    const reservedMap = new Map();

    loans.forEach((loan) => {
        const itemId = Number(loan.item_id);
        if (!itemId) {
            return;
        }
        reservedMap.set(itemId, (reservedMap.get(itemId) || 0) + 1);
    });

    return reservedMap;
}

function normalizeLoanRow(row) {
    return {
        id: Number(row.id),
        teamId: String(row.team_id || ''),
        teamName: String(row.team_name || 'Unknown Team'),
        teamEmail: String(row.team_email || ''),
        itemId: Number(row.item_id),
        itemName: String(row.item_name || ''),
        status: String(row.status || 'pending'),
        requestedAt: row.requested_at,
        fulfilledAt: row.fulfilled_at,
        returnedAt: row.returned_at,
        notes: String(row.notes || '')
    };
}

function getLoanAvailability() {
    const opensAt = new Date(LOANS_OPEN_AT_ISO);
    const isOpen = Date.now() >= opensAt.getTime();

    return {
        isOpen,
        opensAt: opensAt.toISOString(),
        message: isOpen ? '' : LOANS_OPEN_MESSAGE
    };
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

    let submissions = [];

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
        submissions,
        query: req.query,
        isAdmin
    });
});

app.get('/dashboard/course/:id', requireLogin, async (req, res) => {
    return res.redirect('/dashboard?loan=1');
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
    return res.redirect('/admin');
});

app.post('/admin/courses', requireAdmin, async (req, res) => {
    return res.redirect('/admin');
});

app.post('/admin/courses/delete', requireAdmin, async (req, res) => {
    return res.redirect('/admin');
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
    let submissionCount = 0;

    try {
        const [{ count: teamsCount }, { count: submissionsCount }] = await Promise.all([
            supabase.from(teamsTable).select('*', { count: 'exact', head: true }),
            supabase.from(submissionsTable).select('*', { count: 'exact', head: true })
        ]);

        teamCount = teamsCount || 0;
        submissionCount = submissionsCount || 0;
    } catch (error) {
        console.error('Admin summary fetch failed:', error.message);
    }

    res.render('admin-dashboard', {
        user: req.session.user,
        teamCount,
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

app.get('/api/loans/catalog', requireLogin, async (req, res) => {
    try {
        await ensureElectronicsInventorySeeded();
        const loanAvailability = getLoanAvailability();

        const team = await resolveTeamSummaryForUser(req.session.user);

        const [{ data: inventoryData, error: inventoryError }, { data: activeLoanData, error: activeLoanError }, { data: allOpenLoans, error: allOpenLoansError }, { data: historyData, error: historyError }] = await Promise.all([
            supabase
                .from(electronicsInventoryTable)
                .select('*')
                .order('category', { ascending: true })
                .order('name', { ascending: true }),
            supabase
                .from(electronicsLoansTable)
                .select('*')
                .eq('team_id', team.teamId)
                .in('status', ['pending', 'fulfilled'])
                .order('requested_at', { ascending: false }),
            supabase
                .from(electronicsLoansTable)
                .select('item_id')
                .in('status', ['pending', 'fulfilled']),
            supabase
                .from(electronicsLoansTable)
                .select('*')
                .eq('team_id', team.teamId)
                .order('requested_at', { ascending: false })
                .limit(20)
        ]);

        if (inventoryError || activeLoanError || allOpenLoansError || historyError) {
            return res.status(500).json({
                success: false,
                message: inventoryError?.message || activeLoanError?.message || allOpenLoansError?.message || historyError?.message || 'Failed to fetch loan catalog.'
            });
        }

        const reservedMap = buildReservedMap(allOpenLoans || []);
        const activeLoanIds = new Set((activeLoanData || []).map((row) => Number(row.item_id)));
        const activeLoans = (activeLoanData || []).map(normalizeLoanRow);

        const items = (inventoryData || [])
            .filter((item) => !isRetiredElectronicsItem(item))
            .map((item) => {
            const itemId = Number(item.id);
            const totalStock = Number(item.total_stock || 0);
            const reserved = reservedMap.get(itemId) || 0;
            const available = Math.max(0, totalStock - reserved);

            return {
                id: itemId,
                slug: item.slug,
                name: resolveLoanItemDisplayName(item),
                category: item.category,
                imageUrl: resolveLoanItemImageUrl(item),
                notes: item.notes,
                totalStock,
                reserved,
                available,
                alreadyRequestedByTeam: activeLoanIds.has(itemId)
            };
            });

        const activeCount = activeLoans.length;
        const remainingSlots = Math.max(0, MAX_ACTIVE_LOANS_PER_TEAM - activeCount);

        return res.json({
            success: true,
            team,
            maxActiveLoans: MAX_ACTIVE_LOANS_PER_TEAM,
            loansOpen: loanAvailability.isOpen,
            loansOpenAt: loanAvailability.opensAt,
            loansMessage: loanAvailability.message,
            activeCount,
            remainingSlots,
            activeLoans,
            recentLoans: (historyData || []).map(normalizeLoanRow),
            items
        });
    } catch (error) {
        console.error('Loan catalog fetch failed:', error.message);
        return res.status(500).json({ success: false, message: 'Failed to load electronics catalog.' });
    }
});

app.post('/api/loans/request', requireLogin, async (req, res) => {
    const itemId = Number(req.body?.itemId);
    const loanAvailability = getLoanAvailability();

    if (!loanAvailability.isOpen) {
        return res.status(403).json({ success: false, message: loanAvailability.message, opensAt: loanAvailability.opensAt });
    }

    if (!itemId || Number.isNaN(itemId)) {
        return res.status(400).json({ success: false, message: 'Choose a valid item.' });
    }

    try {
        await ensureElectronicsInventorySeeded();
        const team = await resolveTeamSummaryForUser(req.session.user);

        const [{ data: item, error: itemError }, { data: teamActiveLoans, error: teamLoansError }, { data: openLoansForItem, error: openLoansError }] = await Promise.all([
            supabase.from(electronicsInventoryTable).select('*').eq('id', itemId).maybeSingle(),
            supabase.from(electronicsLoansTable).select('*').eq('team_id', team.teamId).in('status', ['pending', 'fulfilled']),
            supabase.from(electronicsLoansTable).select('id').eq('item_id', itemId).in('status', ['pending', 'fulfilled'])
        ]);

        if (itemError || teamLoansError || openLoansError) {
            return res.status(500).json({
                success: false,
                message: itemError?.message || teamLoansError?.message || openLoansError?.message || 'Failed to validate loan request.'
            });
        }

        if (!item) {
            return res.status(404).json({ success: false, message: 'Item not found.' });
        }

        if (isRetiredElectronicsItem(item)) {
            return res.status(400).json({ success: false, message: 'This item is no longer available for loan.' });
        }

        const activeLoans = teamActiveLoans || [];
        if (activeLoans.length >= MAX_ACTIVE_LOANS_PER_TEAM) {
            return res.status(400).json({ success: false, message: `Loan limit reached. Max ${MAX_ACTIVE_LOANS_PER_TEAM} active items per team.` });
        }

        if (activeLoans.some((loan) => Number(loan.item_id) === itemId)) {
            return res.status(400).json({ success: false, message: 'You already requested this item and it is still active.' });
        }

        const totalStock = Number(item.total_stock || 0);
        const reserved = (openLoansForItem || []).length;
        if (reserved >= totalStock) {
            return res.status(400).json({ success: false, message: 'This item is currently out for loan. Please pick another item.' });
        }

        const payload = {
            team_id: team.teamId,
            team_name: team.teamName,
            team_email: team.teamEmail,
            item_id: itemId,
            item_name: resolveLoanItemDisplayName(item),
            status: 'pending',
            requested_at: new Date().toISOString(),
            notes: 'Loan requested by team. Item must be returned.'
        };

        const { data: created, error: createError } = await supabase
            .from(electronicsLoansTable)
            .insert(payload)
            .select('*')
            .limit(1);

        if (createError) {
            return res.status(500).json({ success: false, message: createError.message });
        }

        return res.json({ success: true, loan: normalizeLoanRow((created || [])[0] || payload) });
    } catch (error) {
        console.error('Loan request failed:', error.message);
        return res.status(500).json({ success: false, message: 'Failed to request item loan.' });
    }
});

app.get('/admin/operations', requireAdmin, (req, res) => {
    res.render('admin-operations', {
        user: req.session.user,
        foodSessions: FOOD_SESSIONS,
        attendanceSessions: ATTENDANCE_SESSIONS,
        teamMembersTable,
        memberOperationsTable
    });
});

app.get('/admin/loans', requireAdmin, (req, res) => {
    res.render('admin-loans', {
        user: req.session.user,
        maxActiveLoans: MAX_ACTIVE_LOANS_PER_TEAM
    });
});

app.get('/api/admin/loans/dashboard', requireAdmin, async (req, res) => {
    try {
        await ensureElectronicsInventorySeeded();

        const [{ data: inventoryData, error: inventoryError }, { data: openLoanData, error: openLoanError }, { data: allLoansData, error: allLoansError }] = await Promise.all([
            supabase
                .from(electronicsInventoryTable)
                .select('*')
                .order('category', { ascending: true })
                .order('name', { ascending: true }),
            supabase
                .from(electronicsLoansTable)
                .select('item_id,status')
                .in('status', ['pending', 'fulfilled']),
            supabase
                .from(electronicsLoansTable)
                .select('*')
                .order('requested_at', { ascending: false })
                .limit(500)
        ]);

        if (inventoryError || openLoanError || allLoansError) {
            return res.status(500).json({
                success: false,
                message: inventoryError?.message || openLoanError?.message || allLoansError?.message || 'Failed to fetch admin loan dashboard.'
            });
        }

        const reservedMap = buildReservedMap(openLoanData || []);
        const inventory = (inventoryData || [])
            .filter((item) => !isRetiredElectronicsItem(item))
            .map((item) => {
            const totalStock = Number(item.total_stock || 0);
            const reserved = reservedMap.get(Number(item.id)) || 0;
            return {
                id: Number(item.id),
                slug: item.slug,
                name: resolveLoanItemDisplayName(item),
                category: item.category,
                imageUrl: resolveLoanItemImageUrl(item),
                notes: item.notes,
                totalStock,
                reserved,
                available: Math.max(0, totalStock - reserved)
            };
            });

        return res.json({
            success: true,
            maxActiveLoans: MAX_ACTIVE_LOANS_PER_TEAM,
            inventory,
            loans: (allLoansData || []).map(normalizeLoanRow)
        });
    } catch (error) {
        console.error('Admin loan dashboard failed:', error.message);
        return res.status(500).json({ success: false, message: 'Failed to load loan dashboard.' });
    }
});

app.post('/api/admin/loans/:loanId/status', requireAdmin, async (req, res) => {
    const loanId = Number(req.params.loanId);
    const nextStatus = String(req.body?.status || '').trim().toLowerCase();

    if (!loanId || Number.isNaN(loanId) || !['pending', 'fulfilled', 'returned'].includes(nextStatus)) {
        return res.status(400).json({ success: false, message: 'Invalid loan update request.' });
    }

    try {
        const { data: loan, error: loanError } = await supabase
            .from(electronicsLoansTable)
            .select('*')
            .eq('id', loanId)
            .maybeSingle();

        if (loanError) {
            return res.status(500).json({ success: false, message: loanError.message });
        }

        if (!loan) {
            return res.status(404).json({ success: false, message: 'Loan record not found.' });
        }

        if (nextStatus === 'fulfilled') {
            if (loan.status === 'returned') {
                return res.status(400).json({ success: false, message: 'Returned loans cannot be fulfilled again.' });
            }

            const [{ data: item, error: itemError }, { data: openLoans, error: openLoansError }] = await Promise.all([
                supabase.from(electronicsInventoryTable).select('id,total_stock').eq('id', loan.item_id).maybeSingle(),
                supabase
                    .from(electronicsLoansTable)
                    .select('id')
                    .eq('item_id', loan.item_id)
                    .in('status', ['pending', 'fulfilled'])
            ]);

            if (itemError || openLoansError) {
                return res.status(500).json({ success: false, message: itemError?.message || openLoansError?.message || 'Failed to verify stock.' });
            }

            const totalStock = Number(item?.total_stock || 0);
            const reservedOthers = Math.max(0, (openLoans || []).length - (loan.status === 'pending' || loan.status === 'fulfilled' ? 1 : 0));
            if (reservedOthers >= totalStock) {
                return res.status(400).json({ success: false, message: 'No stock available to fulfill this request.' });
            }
        }

        const patch = {
            status: nextStatus
        };

        if (nextStatus === 'fulfilled') {
            patch.fulfilled_at = new Date().toISOString();
            patch.fulfilled_by = req.session.user?.email || 'admin';
            patch.returned_at = null;
            patch.returned_by = null;
        }

        if (nextStatus === 'returned') {
            patch.returned_at = new Date().toISOString();
            patch.returned_by = req.session.user?.email || 'admin';
        }

        if (nextStatus === 'pending') {
            patch.fulfilled_at = null;
            patch.fulfilled_by = null;
            patch.returned_at = null;
            patch.returned_by = null;
        }

        const { data: updated, error: updateError } = await supabase
            .from(electronicsLoansTable)
            .update(patch)
            .eq('id', loanId)
            .select('*')
            .limit(1);

        if (updateError) {
            return res.status(500).json({ success: false, message: updateError.message });
        }

        return res.json({ success: true, loan: normalizeLoanRow((updated || [])[0] || { ...loan, ...patch }) });
    } catch (error) {
        console.error('Admin loan status update failed:', error.message);
        return res.status(500).json({ success: false, message: 'Failed to update loan status.' });
    }
});

app.post('/api/admin/inventory/:itemId/stock', requireAdmin, async (req, res) => {
    const itemId = Number(req.params.itemId);
    const totalStock = Number(req.body?.totalStock);

    if (!itemId || Number.isNaN(itemId) || Number.isNaN(totalStock) || totalStock < 0) {
        return res.status(400).json({ success: false, message: 'Provide a valid item and stock count.' });
    }

    try {
        const { data: updated, error } = await supabase
            .from(electronicsInventoryTable)
            .update({ total_stock: Math.floor(totalStock), updated_at: new Date().toISOString() })
            .eq('id', itemId)
            .select('*')
            .limit(1);

        if (error) {
            return res.status(500).json({ success: false, message: error.message });
        }

        if (!(updated || []).length) {
            return res.status(404).json({ success: false, message: 'Inventory item not found.' });
        }

        return res.json({ success: true });
    } catch (error) {
        console.error('Inventory stock update failed:', error.message);
        return res.status(500).json({ success: false, message: 'Failed to update stock count.' });
    }
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

        const sensorKitMap = await fetchSensorKitFulfillmentMap();

        const teams = teamSummaries
            .map((team) => {
                const members = (membersByTeamId.get(team.teamId) || [])
                    .map((memberRow) => buildMemberSummary(memberRow, team))
                    .map((member) => buildMemberWithStatuses(member, statusMap.get(member.memberId)));

                const sensorKitStatus = sensorKitMap[team.teamId] || null;

                return {
                    ...team,
                    members,
                    sensorKitFulfilled: Boolean(sensorKitStatus?.fulfilled),
                    sensorKitFulfilledAt: sensorKitStatus?.fulfilledAt || null,
                    sensorKitFulfilledBy: sensorKitStatus?.fulfilledBy || null
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
app.post('/api/admin/operations/sensor-kit', requireAdmin, async (req, res) => {
    const teamId = String(req.body?.teamId || '').trim();

    if (!teamId) {
        return res.status(400).json({ success: false, message: 'Team id is required.' });
    }

    try {
        const teamMap = await fetchTeamMapByIds([teamId]);
        const team = teamMap.get(teamId);

        if (!team) {
            return res.status(404).json({ success: false, message: 'Team not found.' });
        }

        const status = await markSensorKitFulfilled(team, req.session.user?.email || 'admin');

        return res.json({
            success: true,
            teamId,
            sensorKitFulfilled: true,
            sensorKitFulfilledAt: status?.fulfilledAt || null,
            sensorKitFulfilledBy: status?.fulfilledBy || null
        });
    } catch (error) {
        console.error('Sensor kit mark failed:', error.message);
        return res.status(500).json({ success: false, message: 'Failed to mark sensor kit fulfillment.' });
    }
});

app.listen(3000, () => {
    console.log('Server started on http://localhost:3000');
});