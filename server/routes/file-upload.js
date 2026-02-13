/**
 * File Upload Routes - Handle file uploads for AI analysis
 * Supports: PDF, DOCX, TXT, LOG, JSON, CSV, MD, XML, YAML
 */

import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = Router();

// Upload directory
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Allowed file types
const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.doc', '.txt', '.log', '.json', '.csv', '.md', '.xml', '.yaml', '.yml', '.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.c', '.cpp', '.h', '.go', '.rs', '.sql', '.html', '.css'];
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userDir = path.join(UPLOAD_DIR, `user-${req.user?.id || 'anonymous'}`);
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }
    cb(null, userDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_EXTENSIONS.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${ext} not supported. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE }
});

/**
 * POST /api/files/upload
 * Upload one or more files, returns file info for attaching to chat
 */
router.post('/upload', upload.array('files', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const fileInfos = req.files.map(file => {
      const ext = path.extname(file.originalname).toLowerCase();
      return {
        id: path.basename(file.filename, ext),
        originalName: file.originalname,
        storedPath: file.path,
        size: file.size,
        type: ext.slice(1),
        mimeType: file.mimetype,
        uploadedAt: new Date().toISOString(),
      };
    });

    res.json({ success: true, files: fileInfos });
  } catch (error) {
    console.error('[FileUpload] Error:', error);
    res.status(500).json({ error: error.message || 'Upload failed' });
  }
});

/**
 * GET /api/files/:fileId
 * Read file content (for text-based files)
 */
router.get('/:fileId', async (req, res) => {
  try {
    const userDir = path.join(UPLOAD_DIR, `user-${req.user?.id || 'anonymous'}`);
    const files = fs.readdirSync(userDir);
    const match = files.find(f => f.startsWith(req.params.fileId));

    if (!match) {
      return res.status(404).json({ error: 'File not found' });
    }

    const filePath = path.join(userDir, match);
    const ext = path.extname(match).toLowerCase();

    // For text-based files, return content
    const textExtensions = ['.txt', '.log', '.json', '.csv', '.md', '.xml', '.yaml', '.yml', '.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.c', '.cpp', '.h', '.go', '.rs', '.sql', '.html', '.css'];

    if (textExtensions.includes(ext)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      return res.json({ content, type: 'text', name: match });
    }

    // For binary files, return file download
    res.download(filePath);
  } catch (error) {
    res.status(500).json({ error: 'Failed to read file' });
  }
});

/**
 * DELETE /api/files/:fileId
 * Delete an uploaded file
 */
router.delete('/:fileId', async (req, res) => {
  try {
    const userDir = path.join(UPLOAD_DIR, `user-${req.user?.id || 'anonymous'}`);
    const files = fs.readdirSync(userDir);
    const match = files.find(f => f.startsWith(req.params.fileId));

    if (!match) {
      return res.status(404).json({ error: 'File not found' });
    }

    fs.unlinkSync(path.join(userDir, match));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

export default router;
