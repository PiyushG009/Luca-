import { mkdir, readdir, copyFile, rm } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const distDir = path.join(rootDir, 'dist')
const allowedExtensions = new Set(['.html', '.css', '.js'])
const excludedFiles = new Set(['package.json', 'package-lock.json'])

async function build() {
  await rm(distDir, { recursive: true, force: true })
  await mkdir(distDir, { recursive: true })

  const entries = await readdir(rootDir, { withFileTypes: true })
  const copyJobs = entries
    .filter((entry) => entry.isFile())
    .filter((entry) => allowedExtensions.has(path.extname(entry.name)))
    .filter((entry) => !excludedFiles.has(entry.name))
    .map((entry) => copyFile(path.join(rootDir, entry.name), path.join(distDir, entry.name)))

  await Promise.all(copyJobs)
  console.log(`Built LucaVerse static bundle to ${distDir}`)
}

build().catch((error) => {
  console.error('Build failed:', error)
  process.exitCode = 1
})
