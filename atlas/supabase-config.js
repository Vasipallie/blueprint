// Supabase Configuration
const supabaseUrl = 'https://dcdkecvwahydcjdfvhbz.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjZGtlY3Z3YWh5ZGNqZGZ2aGJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5MDY0NTUsImV4cCI6MjA4NDQ4MjQ1NX0.OPs0Fc07OvPk6ogNvGd2CgaRDuHpQbkYzob5iL_KAcs'
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey)

// Student Functions
async function fetchStudents() {
    const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('name');
    
    if (error) {
        console.error('Error fetching students:', error);
        return [];
    }
    return data;
}

async function updateStudentMeal(studentId, day, meal, value) {
    const column = `${day}_${meal}`;
    const { error } = await supabase
        .from('students')
        .update({ [column]: value })
        .eq('id', studentId);
    
    if (error) console.error('Error updating meal:', error);
    return !error;
}

async function updateStudentCourse(studentId, course, value) {
    const column = `${course}_unlocked`;
    const { error } = await supabase
        .from('students')
        .update({ [column]: value })
        .eq('id', studentId);
    
    if (error) console.error('Error updating course:', error);
    return !error;
}

async function unlockCourseForAll(course, value) {
    const column = `${course}_unlocked`;
    const { error } = await supabase
        .from('students')
        .update({ [column]: value })
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all
    
    if (error) console.error('Error unlocking course:', error);
    return !error;
}

// Course Functions
async function fetchCourses() {
    const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('level');
    
    if (error) {
        console.error('Error fetching courses:', error);
        return [];
    }
    return data;
}

// Project Functions
async function fetchProjects() {
    const { data, error } = await supabase
        .from('projects')
        .select(`
            *,
            students:student_id (name, email)
        `)
        .order('submitted_at', { ascending: false });
    
    if (error) {
        console.error('Error fetching projects:', error);
        return [];
    }
    return data;
}

async function submitProject(studentId, projectData) {
    const { data, error } = await supabase
        .from('projects')
        .insert([{
            student_id: studentId,
            project_name: projectData.name,
            github_repo: projectData.repo,
            pitch_deck_url: projectData.pitchDeck,
            description: projectData.description
        }])
        .select();
    
    if (error) {
        console.error('Error submitting project:', error);
        return null;
    }
    return data[0];
}

async function updateProjectScore(projectId, score) {
    const { error } = await supabase
        .from('projects')
        .update({ score })
        .eq('id', projectId);
    
    if (error) console.error('Error updating score:', error);
    return !error;
}

// Broadcast Functions
async function sendBroadcast(message) {
    const { data, error } = await supabase
        .from('broadcasts')
        .insert([{ message }])
        .select();
    
    if (error) {
        console.error('Error sending broadcast:', error);
        return null;
    }
    return data[0];
}

async function fetchBroadcasts() {
    const { data, error } = await supabase
        .from('broadcasts')
        .select('*')
        .order('sent_at', { ascending: false })
        .limit(10);
    
    if (error) {
        console.error('Error fetching broadcasts:', error);
        return [];
    }
    return data;
}

// Reminder Functions
async function fetchReminders() {
    const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .eq('active', true)
        .order('created_at');
    
    if (error) {
        console.error('Error fetching reminders:', error);
        return [];
    }
    return data;
}
