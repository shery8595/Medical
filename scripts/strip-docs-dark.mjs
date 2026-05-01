import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function walk(d) {
    for (const f of fs.readdirSync(d)) {
        const p = path.join(d, f);
        if (fs.statSync(p).isDirectory()) walk(p);
        else if (f.endsWith(".tsx")) {
            let s = fs.readFileSync(p, "utf8");
            const orig = s;
            s = s.replace(/\s+dark:[^\s"']+/g, "");
            if (s !== orig) {
                fs.writeFileSync(p, s);
                console.log("updated", path.relative(root, p));
            }
        }
    }
}

["src/pages/docs", "src/components/docs"].forEach((rel) => walk(path.join(root, rel)));
