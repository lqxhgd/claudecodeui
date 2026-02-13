// Load environment variables from .env before other imports execute.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

try {
  const envPath = path.join(__dirname, '../.env');
  const envFile = fs.readFileSync(envPath, 'utf8');
  envFile.split('\n').forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valueParts] = trimmedLine.split('=');
      if (key && valueParts.length > 0 && !process.env[key]) {
        process.env[key] = valueParts.join('=').trim();
      }
    }
  });
} catch (e) {
  console.log('No .env file found or error reading it:', e.message);
}

// Auto-detect git-bash path on Windows for Claude CLI compatibility
if (process.platform === 'win32' && !process.env.CLAUDE_CODE_GIT_BASH_PATH) {
  const possiblePaths = [
    'C:\\Program Files\\Git\\bin\\bash.exe',
    'D:\\Program Files\\Git\\bin\\bash.exe',
    'C:\\Git\\bin\\bash.exe',
    path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Git', 'bin', 'bash.exe'),
  ];
  for (const p of possiblePaths) {
    try {
      fs.accessSync(p, fs.constants.X_OK);
      process.env.CLAUDE_CODE_GIT_BASH_PATH = p;
      console.log(`[INFO] Auto-detected git-bash: ${p}`);
      break;
    } catch {
      // Not found at this path, try next
    }
  }
}
