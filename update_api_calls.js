const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            results.push(file);
        }
    });
    return results;
}

const files = walk('src/app/dashboard');
files.forEach(file => {
    if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        let content = fs.readFileSync(file, 'utf-8');
        let newContent = content.replace(/\/api\/fetch-(attendance|cgpa|circulars|exam-seating|fee|hostel|library|marks|profile|timetable)/g, '/api/erp-proxy/$1');
        if (content !== newContent) {
            fs.writeFileSync(file, newContent);
            console.log(`Updated ${file}`);
        }
    }
});
