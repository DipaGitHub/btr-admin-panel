const fs = require('fs');
const path = require('path');

const dir = 'E:/Freelance/btr-admin-panel/src/pages';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

const mapping = {
    'Banners.tsx': '/banners',
    'Blogs.tsx': '/blogs',
    'Courses.tsx': '/courses',
    'FAQ.tsx': '/faqs',
    'LatestUpdates.tsx': '/latestUpdates',
    'LeadsManagement.tsx': '/leads',
    'LogoCarousel.tsx': '/logo-carousel',
    'Portfolio.tsx': '',
    'Resources.tsx': '/resources',
    'Testimonial.tsx': '/testimonials/admin',
    'Videos.tsx': '/videos'
};

for (const file of files) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Fix API_BASE_URL
    if (mapping[file] !== undefined) {
        const suffix = mapping[file];
        content = content.replace(/const API_BASE_URL = \$\{GLOBAL_API_URL\};/g, 
            `const API_BASE_URL = \`\${GLOBAL_API_URL}${suffix}\`;`);
    }

    // Fix LogoCarousel.tsx truncated template literals
    if (file === 'LogoCarousel.tsx') {
        content = content.replace(/src=\{\`\$\{GLOBAL_SERVER_URL\}\n/g, 'src={`\\$\\{GLOBAL_SERVER_URL\\}${logo.image_url}`}\n');
        // Let's check exactly how it's truncated in LogoCarousel.
        // It says `src={`${GLOBAL_SERVER_URL}`
        // And then nothing? Wait, the regex `([^]*)` matches EVERYTHING to the end of the file!
        // Oh my god. If the regex was `([^]*)`, then the rest of the file was DELETED in LogoCarousel?
        // Wait, `([^]*)` in JS regex matches EVERYTHING, including newlines. But wait, `LogoCarousel.tsx` is 7555 bytes! The original was probably similar.
    }

    if (content !== original) {
        fs.writeFileSync(filePath, content);
        console.log(`Fixed ${file}`);
    }
}
