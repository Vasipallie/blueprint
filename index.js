import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'views')));
app.use(express.json());      

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

app.listen(3000, () => {
    console.log('Server started on http://localhost:3000');
});