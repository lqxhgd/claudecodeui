/**
 * PDF Conversion Routes - Convert PDF to DOC/DOCX format
 * Uses pdf-parse for reading PDF and docx for generating Word documents
 */

import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = Router();

const CONVERT_DIR = path.join(__dirname, '..', 'uploads', 'conversions');
if (!fs.existsSync(CONVERT_DIR)) {
  fs.mkdirSync(CONVERT_DIR, { recursive: true });
}

/**
 * POST /api/convert/pdf-to-doc
 * Convert uploaded PDF file to DOCX
 * Accepts: multipart/form-data with 'file' field
 */
router.post('/pdf-to-doc', async (req, res) => {
  let tempPdfPath = null;

  try {
    // Dynamic imports for optional dependencies
    let pdfParse, docx, multer;

    try {
      pdfParse = (await import('pdf-parse')).default;
    } catch {
      return res.status(500).json({
        error: 'pdf-parse not installed. Run: npm install pdf-parse',
        installCmd: 'npm install pdf-parse'
      });
    }

    try {
      docx = await import('docx');
    } catch {
      return res.status(500).json({
        error: 'docx not installed. Run: npm install docx',
        installCmd: 'npm install docx'
      });
    }

    try {
      multer = (await import('multer')).default;
    } catch {
      return res.status(500).json({
        error: 'multer not installed. Run: npm install multer',
        installCmd: 'npm install multer'
      });
    }

    // Handle file upload inline
    const upload = multer({
      dest: CONVERT_DIR,
      limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
      fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf' || path.extname(file.originalname).toLowerCase() === '.pdf') {
          cb(null, true);
        } else {
          cb(new Error('Only PDF files are accepted'));
        }
      }
    }).single('file');

    // Wrap multer in a promise
    await new Promise((resolve, reject) => {
      upload(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file provided' });
    }

    tempPdfPath = req.file.path;
    const originalName = path.basename(req.file.originalname, '.pdf');

    // Read and parse PDF
    const pdfBuffer = fs.readFileSync(tempPdfPath);
    const pdfData = await pdfParse(pdfBuffer);

    // Split text into paragraphs
    const paragraphs = pdfData.text
      .split(/\n\s*\n/)
      .map(p => p.trim())
      .filter(p => p.length > 0);

    // Create DOCX document
    const { Document, Packer, Paragraph, TextRun, HeadingLevel } = docx;

    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          // Title
          new Paragraph({
            children: [new TextRun({ text: originalName, bold: true, size: 32 })],
            heading: HeadingLevel.TITLE,
          }),
          // Metadata
          new Paragraph({
            children: [
              new TextRun({ text: `Converted from PDF | Pages: ${pdfData.numpages} | `, size: 18, color: '888888' }),
              new TextRun({ text: new Date().toLocaleDateString(), size: 18, color: '888888' }),
            ],
            spacing: { after: 300 },
          }),
          // Content paragraphs
          ...paragraphs.map(text => new Paragraph({
            children: [new TextRun({ text, size: 24 })],
            spacing: { after: 200 },
          })),
        ],
      }],
    });

    // Generate DOCX buffer
    const docxBuffer = await Packer.toBuffer(doc);

    // Save output file
    const outputName = `${originalName}-converted-${Date.now()}.docx`;
    const outputPath = path.join(CONVERT_DIR, outputName);
    fs.writeFileSync(outputPath, docxBuffer);

    // Clean up temp PDF
    if (tempPdfPath && fs.existsSync(tempPdfPath)) {
      fs.unlinkSync(tempPdfPath);
    }

    // Send the DOCX file
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(outputName)}"`);
    res.send(docxBuffer);

    // Clean up output file after sending (delayed)
    setTimeout(() => {
      try { fs.unlinkSync(outputPath); } catch {}
    }, 60000);

  } catch (error) {
    console.error('[PDF Convert] Error:', error);
    // Clean up temp file on error
    if (tempPdfPath && fs.existsSync(tempPdfPath)) {
      try { fs.unlinkSync(tempPdfPath); } catch {}
    }
    res.status(500).json({ error: error.message || 'Conversion failed' });
  }
});

/**
 * GET /api/convert/status
 * Check if required dependencies are installed
 */
router.get('/status', async (req, res) => {
  const deps = {};
  try { await import('pdf-parse'); deps.pdfParse = true; } catch { deps.pdfParse = false; }
  try { await import('docx'); deps.docx = true; } catch { deps.docx = false; }
  try { await import('multer'); deps.multer = true; } catch { deps.multer = false; }

  const allReady = Object.values(deps).every(v => v);
  res.json({ ready: allReady, dependencies: deps });
});

export default router;
