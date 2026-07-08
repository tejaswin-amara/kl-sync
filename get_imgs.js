const fs = require('fs');
const cheerio = require('cheerio');
const html = fs.readFileSync('profile_dump.html', 'utf-8');
const $ = cheerio.load(html);
$('img').each((i, el) => {
    const src = $(el).attr('src');
    if (src && src.replace(/\s/g, '').startsWith('data:image')) {
        console.log(src.substring(0, 50));
    }
});
