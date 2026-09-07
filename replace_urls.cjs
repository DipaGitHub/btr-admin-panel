const fs = require('fs');
const path = require('path');

const dir = 'E:/Freelance/btr-admin-panel/src/pages';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // 1. Replace the API_BASE_URL declaration
    if (content.includes('https://btr.braventra.in/api')) {
        content = content.replace(/const API_BASE_URL = ['"]https:\/\/btr\.braventra\.in\/api([^'"]*)['"];/g, 
            'import { API_BASE_URL as GLOBAL_API_URL, SERVER_URL as GLOBAL_SERVER_URL } from "@/config/api";\nconst API_BASE_URL = ${GLOBAL_API_URL};');
    }
    
    // 2. Replace BASE_URL declaration
    if (content.includes('const BASE_URL')) {
        content = content.replace(/const BASE_URL(?:[:\sstring]*)? = ['"]https:\/\/btr\.braventra\.in[^'"]*['"];/g, 
            'import { SERVER_URL as GLOBAL_SERVER_URL } from "@/config/api";\nconst BASE_URL = GLOBAL_SERVER_URL;');
    }
    
    // 3. Replace IMAGE_BASE_URL declaration
    if (content.includes('const IMAGE_BASE_URL')) {
        content = content.replace(/const IMAGE_BASE_URL = ['"]https:\/\/btr\.braventra\.in['"];/g, 
            'import { SERVER_URL as GLOBAL_SERVER_URL } from "@/config/api";\nconst IMAGE_BASE_URL = GLOBAL_SERVER_URL;');
    }
    
    // 4. Inline usages in templates like src={https://btr.braventra.in...}
    content = content.replace(/https:\/\/btr\.braventra\.in([^]*)/g, '${GLOBAL_SERVER_URL}');

    // 5. Clean up duplicate imports
    let importRegex = /import \{ [^}]+ \} from "@\/config\/api";\n/g;
    let imports = content.match(importRegex);
    if (imports && imports.length > 1) {
        // Keep only the first one
        let first = true;
        content = content.replace(importRegex, (match) => {
            if (first) { first = false; return match; }
            return '';
        });
    }

    if (content !== original) {
        // Since we injected GLOBAL_SERVER_URL without checking if it exists in the import, make sure the first import has it.
        if (content.includes('GLOBAL_SERVER_URL') && content.includes('GLOBAL_API_URL') && content.match(/import \{ [^}]+ \} from "@\/config\/api";/)) {
            content = content.replace(/import \{ [^}]+ \} from "@\/config\/api";/, 'import { API_BASE_URL as GLOBAL_API_URL, SERVER_URL as GLOBAL_SERVER_URL } from "@/config/api";');
        } else if (content.includes('GLOBAL_SERVER_URL') && content.match(/import \{ [^}]+ \} from "@\/config\/api";/)) {
            content = content.replace(/import \{ [^}]+ \} from "@\/config\/api";/, 'import { SERVER_URL as GLOBAL_SERVER_URL } from "@/config/api";');
        }
        
        fs.writeFileSync(filePath, content);
        console.log("Updated", file);
    }
}
