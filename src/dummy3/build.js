import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const dir = fileURLToPath(import.meta.resolve("."))
const output = path.join(dir, "dist")

fs.mkdirSync(output)
fs.writeFileSync(path.join(output, "index.html"), `<h1>created page</h1>`)
