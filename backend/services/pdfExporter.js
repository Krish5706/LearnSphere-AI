/**
 * PDF Export Service
 * Generates formatted PDF files with analysis results
 */

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

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
     * Generate formatted PDF report
     * @param {Object} data
     * @param {'summary'|'short'|'medium'|'detailed'|'quiz'|'comprehensive'} type
     * @returns {Promise<string>}
     */
    async generateReport(data = {}, type = 'comprehensive') {
        const filename = `report-${Date.now()}-${cryptoRandom()}.pdf`;
        const filepath = path.join(this.uploadDir, filename);

        const doc = new PDFDocument({
            size: 'A4',
            margin: 50,
            bufferPages: true
        });

        const stream = fs.createWriteStream(filepath);
        doc.pipe(stream);

        switch (type) {
            case 'summary':
                this._addSummaryContent(doc, data);
                break;
            case 'short':
                this._addShortSummaryContent(doc, data);
                break;
            case 'medium':
                this._addMediumSummaryContent(doc, data);
                break;
            case 'detailed':
                this._addDetailedSummaryContent(doc, data);
                break;
            case 'quiz':
                this._addQuizContent(doc, data);
                break;
            default:
                this._addComprehensiveContent(doc, data);
        }

        this._addFooter(doc);
        doc.end();

        return new Promise((resolve, reject) => {
            stream.on('finish', () => resolve(filepath));
            stream.on('error', reject);
        });
    }

    /* ------------------------------------------------------------------ */
    /* Helpers                                                            */
    /* ------------------------------------------------------------------ */

    _header(doc, title, fileName) {
        doc.fontSize(24).font('Helvetica-Bold').fillColor('#000')
            .text(title, { align: 'center' });
        doc.moveDown(0.5);

        doc.fontSize(11).font('Helvetica').fillColor('#666');
        doc.text(`Document: ${fileName || 'Unknown'}`);
        doc.text(`Generated: ${formatDate()}`);
        doc.moveDown();
    }

    _sectionTitle(doc, text) {
        doc.fontSize(14).font('Helvetica-Bold').fillColor('#000').text(text);
    }

    _bodyText(doc, text = '') {
        doc.fontSize(11).font('Helvetica').fillColor('#333').text(text);
    }

    /* ------------------------------------------------------------------ */
    /* Summary Types                                                       */
    /* ------------------------------------------------------------------ */

    _addSummaryContent(doc, data) {
        this._header(doc, 'Document Summary Report', data.fileName);

        if (data.summary?.short) {
            this._sectionTitle(doc, 'Short Summary');
            this._bodyText(doc, data.summary.short);
            doc.moveDown();
        }

        if (data.summary?.medium) {
            this._sectionTitle(doc, 'Medium Summary');
            this._bodyText(doc, data.summary.medium);
            doc.moveDown();
        }

        if (data.summary?.detailed) {
            this._sectionTitle(doc, 'Detailed Summary');
            this._bodyText(doc, data.summary.detailed);
            doc.moveDown();
        }

        this._renderKeyPoints(doc, data.keyPoints);
    }

    _addShortSummaryContent(doc, data) {
        this._header(doc, 'Short Summary Report', data.fileName);
        this._sectionTitle(doc, 'Short Summary');
        this._bodyText(doc, data.summary?.short || 'Short summary not available');
    }

    _addMediumSummaryContent(doc, data) {
        this._header(doc, 'Medium Summary Report', data.fileName);
        this._sectionTitle(doc, 'Medium Summary');
        this._bodyText(doc, data.summary?.medium || 'Medium summary not available');
        this._renderKeyPoints(doc, data.keyPoints, 'Key Insights');
    }

    _addDetailedSummaryContent(doc, data) {
        this._header(doc, 'Detailed Summary Report', data.fileName);
        this._sectionTitle(doc, 'Detailed Summary');
        this._bodyText(doc, data.summary?.detailed || 'Detailed summary not available');
        this._renderKeyPoints(doc, data.keyPoints, 'Key Insights');
    }

    /* ------------------------------------------------------------------ */
    /* Quiz                                                               */
    /* ------------------------------------------------------------------ */

    _addQuizContent(doc, data) {
        this._header(doc, 'Quiz Results Report', data.fileName);

        const stats = data.quizAnalysis || {};

        doc.fontSize(16).font('Helvetica-Bold')
            .fillColor('#1e40af')
            .text(`Score: ${stats.score}/${stats.totalQuestions}`);

        doc.fontSize(14).font('Helvetica-Bold')
            .fillColor(`#${this._getScoreColor(stats.percentage || 0)}`)
            .text(`${stats.percentage || 0}% - ${stats.performanceLevel || ''}`);

        doc.moveDown();
        this._bodyText(doc, stats.feedback);

        if (Array.isArray(data.answeredQuestions)) {
            doc.moveDown();
            this._sectionTitle(doc, 'Question Review');

            data.answeredQuestions.forEach((q, idx) => {
                doc.fontSize(11).font('Helvetica-Bold')
                    .fillColor(q.isCorrect ? '#065f46' : '#991b1b')
                    .text(`Q${idx + 1}. ${q.question}`, { underline: true });

                doc.fontSize(10).font('Helvetica').fillColor('#666');
                q.options.forEach(opt => {
                    const isUser = opt === q.userAnswer;
                    const isCorrect = opt === q.correctAnswer;
                    doc.text(`  ○ ${opt}${isUser ? ' ← Your answer' : ''}${isCorrect ? ' ✓ Correct' : ''}`);
                });

                this._bodyText(doc, `Explanation: ${q.explanation || ''}`);
                doc.moveDown(0.5);
            });
        }

        if (stats.topicsToFocus?.length) {
            doc.moveDown();
            this._sectionTitle(doc, 'Areas for Improvement');
            stats.topicsToFocus.forEach(t => {
                this._bodyText(doc, `• ${t.topic}`);
                doc.fontSize(10).fillColor('#666').text(`  → ${t.reason}`);
            });
        }
    }

    /* ------------------------------------------------------------------ */
    /* Comprehensive                                                      */
    /* ------------------------------------------------------------------ */

    _addComprehensiveContent(doc, data) {
        doc.fontSize(28).font('Helvetica-Bold')
            .text('Learning Analysis Report', { align: 'center' });
        doc.moveDown(0.5);

        doc.fontSize(14).font('Helvetica').fillColor('#666')
            .text(data.fileName || 'Document', { align: 'center' });
        doc.moveDown(2);

        doc.fontSize(11).font('Helvetica').fillColor('#666')
            .text(`Generated: ${formatDate()}`);

        doc.addPage();
        this._addSummaryContent(doc, data);

        if (data.quizAnalysis) {
            doc.addPage();
            this._addQuizContent(doc, data);
        }
    }

    /* ------------------------------------------------------------------ */
    /* Shared                                                             */
    /* ------------------------------------------------------------------ */

    _renderKeyPoints(doc, points = [], title = 'Key Points') {
        if (!points.length) return;
        this._sectionTitle(doc, title);
        points.forEach((p, i) => this._bodyText(doc, `${i + 1}. ${p}`));
        doc.moveDown();
    }

    _addFooter(doc) {
        const count = doc.bufferedPageRange().count;
        for (let i = 0; i < count; i++) {
            doc.switchToPage(i);
            doc.fontSize(9).fillColor('#999')
                .text(`Page ${i + 1} of ${count}`, 0, doc.page.height - 30, {
                    align: 'center'
                });
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
/* Utils                                                              */
/* ------------------------------------------------------------------ */

function formatDate() {
    return new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function cryptoRandom() {
    return Math.random().toString(36).slice(2, 10);
}

module.exports = new PDFExporter();
