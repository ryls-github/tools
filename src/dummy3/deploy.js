import fs from "node:fs"
import { fileURLToPath } from "node:url"

const [target] = process.argv.slice(2)

if (!target) {
    console.error("コピー先を入力してください")
    process.exit(1)
}

if (fs.existsSync(fs)) {
    console.error("コピー先が存在します")
    process.exit(1)
}

const dir = fileURLToPath(import.meta.resolve("."))
const src = path.join(dir, "dist")

fs.cpSync(src, target, { recursive: true })
