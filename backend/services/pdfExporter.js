/**
 * PDF Export Service - Professional Version
 * Generates readable, well-formatted PDF reports with AI analysis
 */

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class PDFExporter {
    constructor() {
        this.uploadDir = path.join(__dirname, '../uploads/generated-reports');
        this.ensureDirectory();
    }

    ensureDirectory() {
        if (!fs.existsSync(this.uploadDir)) {
            fs.mkdirSync(this.uploadDir, { recursive: true });
        }
    }

    /**
     * Generate PDF file and save to disk
     * @param {Object} data
     * @param {'summary'|'short'|'medium'|'detailed'|'quiz'|'comprehensive'} type
     * @returns {Promise<string>} file path
     */
    async generateReport(data = {}, type = 'comprehensive') {
        const filename = `report-${Date.now()}-${cryptoRandom()}.pdf`;
        const filepath = path.join(this.uploadDir, filename);

        const doc = new PDFDocument({
            size: 'A4',
            margin: 50,
            bufferPages: true,
            lineGap: 6
        });

        const stream = fs.createWriteStream(filepath);
        doc.pipe(stream);

        // Professional flow
        this._addCoverPage(doc, data, type);
        this._addTableOfContents(doc, type);
        this._addContentByType(doc, data, type);
        this._addFooter(doc);

        doc.end();

        return new Promise((resolve, reject) => {
            stream.on('finish', () => resolve(filepath));
            stream.on('error', err => reject(new Error('PDF Stream Error: ' + err.message)));
        });
    }

    /**
     * Generate PDF buffer instead of file
     * @param {Object} data
     * @param {'summary'|'short'|'medium'|'detailed'|'quiz'|'comprehensive'} type
     * @returns {Promise<Buffer>}
     */
    async generateReportBuffer(data = {}, type = 'comprehensive') {
        const doc = new PDFDocument({
            size: 'A4',
            margin: 50,
            bufferPages: true
        });

        const chunks = [];
        doc.on('data', chunk => chunks.push(chunk));

        this._addCoverPage(doc, data, type);
        this._addTableOfContents(doc, type);
        this._addContentByType(doc, data, type);
        this._addFooter(doc);
        doc.end();

        return new Promise((resolve, reject) => {
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', err => reject(new Error('PDF Buffer Error: ' + err.message)));
        });
    }

    /* ------------------------------------------------------------------ */
    /* Core PDF Sections                                                  */
    /* ------------------------------------------------------------------ */

    _addContentByType(doc, data, type) {
        switch (type) {
            case 'summary': this._addSummaryContent(doc, data); break;
            case 'short': this._addShortSummaryContent(doc, data); break;
            case 'medium': this._addMediumSummaryContent(doc, data); break;
            case 'detailed': this._addDetailedSummaryContent(doc, data); break;
            case 'quiz': this._addQuizContent(doc, data); break;
            default: this._addComprehensiveContent(doc, data); break;
        }
    }

    _header(doc, title, fileName) {
        doc.fontSize(24).font('Helvetica-Bold').fillColor('#111').text(title || 'Report', { align: 'center' });
        doc.moveDown(0.3);
        doc.fontSize(11).font('Helvetica').fillColor('#666')
            .text(`Document: ${fileName || 'Unknown'}`, { align: 'center' })
            .text(`Generated: ${formatDate()}`, { align: 'center' });
        doc.moveDown(1);
    }

    _sectionTitle(doc, text) {
        if (!text) return;
        doc.moveDown(0.5);
        doc.fontSize(14).font('Helvetica-Bold').fillColor('#111').text(text);
        doc.moveDown(0.3);
    }

    _bodyText(doc, text = 'N/A') {
        doc.fontSize(11).font('Helvetica').fillColor('#333').text(text, { lineGap: 4 });
    }

    _renderKeyPoints(doc, points = [], title = 'Key Points') {
        if (!Array.isArray(points) || points.length === 0) return;
        this._sectionTitle(doc, title);
        points.forEach((p, i) => this._bodyText(doc, `${i + 1}. ${p || ''}`));
    }

    /* ------------------------------------------------------------------ */
    /* Summary / Detailed Content                                         */
    /* ------------------------------------------------------------------ */

    _addSummaryContent(doc, data) {
        this._header(doc, 'Document Summary', data.fileName);

        if (data.summary?.short) {
            this._sectionTitle(doc, 'Short Summary');
            this._bodyText(doc, data.summary.short);
        }
        if (data.summary?.medium) {
            this._sectionTitle(doc, 'Medium Summary');
            this._bodyText(doc, data.summary.medium);
        }
        if (data.summary?.detailed) {
            this._sectionTitle(doc, 'Detailed Summary');
            this._bodyText(doc, data.summary.detailed);
        }

        this._renderKeyPoints(doc, data.keyPoints);
    }

    _addShortSummaryContent(doc, data) {
        this._header(doc, 'Short Summary', data.fileName);
        this._sectionTitle(doc, 'Summary');
        this._bodyText(doc, data.summary?.short || 'N/A');
    }

    _addMediumSummaryContent(doc, data) {
        this._header(doc, 'Medium Summary', data.fileName);
        this._sectionTitle(doc, 'Summary');
        this._bodyText(doc, data.summary?.medium || 'N/A');
        this._renderKeyPoints(doc, data.keyPoints, 'Key Insights');
    }

    _addDetailedSummaryContent(doc, data) {
        this._header(doc, 'Detailed Summary', data.fileName);
        this._sectionTitle(doc, 'Summary');
        this._bodyText(doc, data.summary?.detailed || 'N/A');
        this._renderKeyPoints(doc, data.keyPoints, 'Key Insights');
    }

    _addComprehensiveContent(doc, data) {
        this._addSummaryContent(doc, data);
        if (data.quizAnalysis) {
            doc.addPage();
            this._addQuizContent(doc, data);
        }
    }

    /* ------------------------------------------------------------------ */
    /* Quiz Section                                                      */
    /* ------------------------------------------------------------------ */

    _addQuizContent(doc, data) {
        this._header(doc, 'Quiz Results', data.fileName);
        const stats = data.quizAnalysis || {};

        doc.fontSize(16).font('Helvetica-Bold').fillColor('#1e40af')
            .text(`Score: ${stats.score || 0}/${stats.totalQuestions || 0}`);
        doc.fontSize(14).font('Helvetica-Bold').fillColor(`#${this._getScoreColor(stats.percentage || 0)}`)
            .text(`${stats.percentage || 0}% - ${stats.performanceLevel || 'N/A'}`);
        doc.moveDown();
        this._bodyText(doc, stats.feedback || '');

        if (Array.isArray(data.answeredQuestions)) {
            this._sectionTitle(doc, 'Question Review');
            data.answeredQuestions.forEach((q, idx) => {
                doc.fontSize(11).font('Helvetica-Bold')
                    .fillColor(q.isCorrect ? '#065f46' : '#991b1b')
                    .text(`Q${idx + 1}. ${q.question || 'N/A'}`, { underline: true });

                doc.fontSize(10).font('Helvetica').fillColor('#666');
                (q.options || []).forEach(opt => {
                    const isUser = opt === q.userAnswer;
                    const isCorrect = opt === q.correctAnswer;
                    doc.text(`  ○ ${opt}${isUser ? ' ← Your answer' : ''}${isCorrect ? ' ✓ Correct' : ''}`);
                });

                this._bodyText(doc, `Explanation: ${q.explanation || 'N/A'}`);
                doc.moveDown(0.5);
            });
        }

        if (Array.isArray(stats.topicsToFocus) && stats.topicsToFocus.length) {
            this._sectionTitle(doc, 'Areas for Improvement');
            stats.topicsToFocus.forEach(t => {
                this._bodyText(doc, `• ${t.topic || 'N/A'}`);
                doc.fontSize(10).fillColor('#666').text(`  → ${t.reason || ''}`);
            });
        }
    }

    /* ------------------------------------------------------------------ */
    /* Cover Page & Table of Contents                                     */
    /* ------------------------------------------------------------------ */

    _addCoverPage(doc, data, type) {
        doc.fontSize(28).font('Helvetica-Bold').fillColor('#1e40af')
            .text('LearnSphere AI', { align: 'center' });
        doc.moveDown(0.5);

        doc.fontSize(22).font('Helvetica-Bold').fillColor('#000')
            .text('Document Analysis Report', { align: 'center' });
        doc.moveDown(0.5);

        doc.fontSize(16).font('Helvetica').fillColor('#333')
            .text(`Report Type: ${this._getReportTypeName(type)}`, { align: 'center' });
        doc.moveDown(0.2);

        doc.fontSize(14).font('Helvetica').fillColor('#666')
            .text(`Document: ${data.fileName || 'Unknown'}`, { align: 'center' });
        doc.moveDown(0.2);

        doc.fontSize(12).font('Helvetica').fillColor('#666')
            .text(`Generated: ${formatDate()}`, { align: 'center' });
        doc.moveDown(0.2);

        doc.fontSize(10).font('Helvetica').fillColor('#999')
            .text('Powered by AI Technology', { align: 'center' });

        doc.addPage();
    }

    _addTableOfContents(doc, type) {
        doc.fontSize(18).font('Helvetica-Bold').fillColor('#111')
            .text('Table of Contents', { align: 'center' });
        doc.moveDown(0.5);

        const contents = this._getTableOfContents(type);
        contents.forEach((item, index) => {
            doc.fontSize(12).font('Helvetica').fillColor('#000').text(`${index + 1}. ${item.title}`, 100);
            doc.fontSize(10).font('Helvetica').fillColor('#666').text(`Page ${item.page}`, 450);
            doc.moveDown(0.3);
        });

        doc.addPage();
    }

    _getReportTypeName(type) {
        return {
            summary: 'Document Summary',
            short: 'Short Summary',
            medium: 'Medium Summary',
            detailed: 'Detailed Summary',
            quiz: 'Quiz Results',
            comprehensive: 'Comprehensive Analysis'
        }[type] || 'Analysis Report';
    }

    _getTableOfContents(type) {
        const baseContents = [{ title: 'Executive Summary', page: 3 }];
        switch (type) {
            case 'summary': return [...baseContents, { title: 'Document Summaries', page: 4 }, { title: 'Key Points', page: 5 }];
            case 'short': return [...baseContents, { title: 'Short Summary', page: 4 }];
            case 'medium': return [...baseContents, { title: 'Medium Summary', page: 4 }, { title: 'Key Insights', page: 5 }];
            case 'detailed': return [...baseContents, { title: 'Detailed Summary', page: 4 }, { title: 'Key Insights', page: 5 }];
            case 'quiz': return [...baseContents, { title: 'Quiz Results', page: 4 }, { title: 'Question Review', page: 5 }, { title: 'Areas for Improvement', page: 6 }];
            default: return [...baseContents, { title: 'Document Summaries', page: 4 }, { title: 'Key Points', page: 5 }, { title: 'Quiz Results', page: 6 }, { title: 'Question Review', page: 7 }, { title: 'Areas for Improvement', page: 8 }];
        }
    }

    /* ------------------------------------------------------------------ */
    /* Footer & Utilities                                                 */
    /* ------------------------------------------------------------------ */

    _addFooter(doc) {
        const count = doc.bufferedPageRange().count;
        for (let i = 0; i < count; i++) {
            doc.switchToPage(i);
            doc.fontSize(9).fillColor('#999')
                .text(`Page ${i + 1} of ${count}`, 0, doc.page.height - 30, { align: 'center' });
        }
    }

    _getScoreColor(p = 0) {
        if (p >= 90) return '16a34a';
        if (p >= 75) return '0891b2';
        if (p >= 60) return 'f59e0b';
        return 'dc2626';
    }
}

/* ------------------------------------------------------------------ */
/* Utilities                                                           */
/* ------------------------------------------------------------------ */

function formatDate() {
    return new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function cryptoRandom() {
    return crypto.randomBytes(4).toString('hex');
}

module.exports = new PDFExporter();
