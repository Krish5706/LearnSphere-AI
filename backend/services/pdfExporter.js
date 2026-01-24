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
     * Generate a formatted PDF report
     * @param {Object} data - Report data
     * @param {string} type - 'summary' | 'quiz' | 'comprehensive'
     * @returns {Promise<string>} - Path to generated PDF
     */
    async generateReport(data, type = 'comprehensive') {
        try {
            const filename = `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.pdf`;
            const filepath = path.join(this.uploadDir, filename);

            const doc = new PDFDocument({
                size: 'A4',
                margin: 50,
                bufferPages: true,
            });

            const stream = fs.createWriteStream(filepath);
            doc.pipe(stream);

            // Add content based on type
            switch (type) {
                case 'summary':
                    this._addSummaryContent(doc, data);
                    break;
                case 'quiz':
                    this._addQuizContent(doc, data);
                    break;
                                case 'comprehensive':
                    this._addComprehensiveContent(doc, data);
                    break;
                default:
                    this._addComprehensiveContent(doc, data);
            }

            // Add footer
            this._addFooter(doc);

            // Finalize PDF
            doc.end();

            return new Promise((resolve, reject) => {
                stream.on('finish', () => resolve(filepath));
                stream.on('error', reject);
            });
        } catch (error) {
            throw new Error(`Failed to generate PDF report: ${error.message}`);
        }
    }

    /**
     * Add summary content to PDF
     * @private
     */
    _addSummaryContent(doc, data) {
        // Title
        doc.fontSize(24).font('Helvetica-Bold').text('Document Summary Report', { align: 'center' });
        doc.moveDown(0.5);

        // Document Info
        doc.fontSize(11).font('Helvetica').fillColor('#666');
        doc.text(`Document: ${data.fileName || 'Unknown'}`);
        doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { 
            year: 'numeric', month: 'long', day: 'numeric', 
            hour: '2-digit', minute: '2-digit' 
        })}`);
        doc.moveDown();

        // Summaries
        doc.fillColor('#000').fontSize(14).font('Helvetica-Bold').text('Short Summary');
        doc.fontSize(11).font('Helvetica').fillColor('#333');
        doc.text(data.summary?.short || 'No summary available', { align: 'left' });
        doc.moveDown();

        if (data.summary?.medium) {
            doc.fontSize(14).font('Helvetica-Bold').fillColor('#000').text('Medium Summary');
            doc.fontSize(11).font('Helvetica').fillColor('#333');
            doc.text(data.summary.medium, { align: 'left' });
            doc.moveDown();
        }

        if (data.summary?.detailed) {
            doc.fontSize(14).font('Helvetica-Bold').fillColor('#000').text('Detailed Summary');
            doc.fontSize(11).font('Helvetica').fillColor('#333');
            doc.text(data.summary.detailed, { align: 'left' });
            doc.moveDown();
        }

        // Key Points
        if (data.keyPoints && data.keyPoints.length > 0) {
            doc.fontSize(14).font('Helvetica-Bold').fillColor('#000').text('Key Points');
            doc.fontSize(11).font('Helvetica').fillColor('#333');
            data.keyPoints.forEach((point, idx) => {
                doc.text(`${idx + 1}. ${point}`);
            });
        }
    }

    /**
     * Add quiz content to PDF
     * @private
     */
    _addQuizContent(doc, data) {
        // Title
        doc.fontSize(24).font('Helvetica-Bold').text('Quiz Results Report', { align: 'center' });
        doc.moveDown(0.5);

        // Quiz Stats
        const stats = data.quizAnalysis || {};
        doc.fontSize(11).font('Helvetica').fillColor('#666');
        doc.text(`Document: ${data.fileName || 'Unknown'}`);
        doc.text(`Test Date: ${new Date().toLocaleDateString('en-US', { 
            year: 'numeric', month: 'long', day: 'numeric', 
            hour: '2-digit', minute: '2-digit' 
        })}`);
        doc.moveDown();

        // Score Section
        doc.fontSize(16).font('Helvetica-Bold').fillColor('#1e40af').text(`Score: ${stats.score}/${stats.totalQuestions}`);
        doc.fontSize(14).font('Helvetica-Bold').fillColor(`#${this._getScoreColor(stats.percentage)}`).text(`${stats.percentage}% - ${stats.performanceLevel || 'N/A'}`);
        doc.moveDown(0.5);

        doc.fontSize(11).font('Helvetica').fillColor('#333').text(stats.feedback || '');
        doc.moveDown();

        // Questions Review
        if (data.answeredQuestions && data.answeredQuestions.length > 0) {
            doc.fontSize(14).font('Helvetica-Bold').fillColor('#000').text('Question Review');
            doc.moveDown(0.3);

            data.answeredQuestions.forEach((q, idx) => {
                const bgColor = q.isCorrect ? '#d1fae5' : '#fee2e2';
                const textColor = q.isCorrect ? '#065f46' : '#991b1b';
                
                doc.fontSize(11).font('Helvetica-Bold').fillColor(textColor)
                    .text(`Q${idx + 1}. ${q.question}`, { underline: true });
                doc.fontSize(10).font('Helvetica').fillColor('#666');
                q.options.forEach(opt => {
                    const mark = opt === q.userAnswer ? ' ← Your answer' : '';
                    const correct = opt === q.correctAnswer ? ' ✓ Correct' : '';
                    doc.text(`  ○ ${opt}${mark}${correct}`);
                });
                doc.text(`Explanation: ${q.explanation}`);
                doc.moveDown(0.3);
            });
        }

        // Topics to Focus
        if (stats.topicsToFocus && stats.topicsToFocus.length > 0) {
            doc.moveDown(0.5);
            doc.fontSize(14).font('Helvetica-Bold').fillColor('#000').text('Areas for Improvement');
            doc.fontSize(11).font('Helvetica').fillColor('#333');
            stats.topicsToFocus.forEach((topic, idx) => {
                doc.text(`${idx + 1}. ${topic.topic}`);
                doc.fontSize(10).fillColor('#666').text(`   → ${topic.reason}`);
                doc.fontSize(11).fillColor('#333');
            });
        }
    }

    /**
     * Add comprehensive content with all analysis
     * @private
     */
    _addComprehensiveContent(doc, data) {
        // Title Page
        doc.fontSize(28).font('Helvetica-Bold').text('Learning Analysis Report', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(14).font('Helvetica').fillColor('#666').text(data.fileName || 'Document', { align: 'center' });
        doc.moveDown(2);

        doc.fontSize(11).font('Helvetica').fillColor('#666');
        doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { 
            year: 'numeric', month: 'long', day: 'numeric', 
            hour: '2-digit', minute: '2-digit' 
        })}`);
        
        doc.addPage();

        // Summary Section
        if (data.summary) {
            doc.fontSize(18).font('Helvetica-Bold').fillColor('#1e40af').text('1. Summary');
            doc.moveDown(0.3);
            
            if (data.summary.short) {
                doc.fontSize(12).font('Helvetica-Bold').fillColor('#000').text('Quick Overview');
                doc.fontSize(11).font('Helvetica').fillColor('#333');
                doc.text(data.summary.short);
                doc.moveDown(0.5);
            }

            if (data.summary.medium) {
                doc.fontSize(12).font('Helvetica-Bold').fillColor('#000').text('Standard Summary');
                doc.fontSize(11).font('Helvetica').fillColor('#333');
                doc.text(data.summary.medium);
                doc.moveDown(0.5);
            }

            if (data.summary.detailed) {
                doc.fontSize(12).font('Helvetica-Bold').fillColor('#000').text('Detailed Breakdown');
                doc.fontSize(11).font('Helvetica').fillColor('#333');
                doc.text(data.summary.detailed);
                doc.moveDown();
            }
        }

        // Key Points
        if (data.keyPoints && data.keyPoints.length > 0) {
            doc.fontSize(18).font('Helvetica-Bold').fillColor('#1e40af').text('2. Key Points');
            doc.moveDown(0.3);
            doc.fontSize(11).font('Helvetica').fillColor('#333');
            data.keyPoints.forEach((point, idx) => {
                doc.text(`• ${point}`);
            });
            doc.moveDown();
        }

        // Mind Map Section
        
        // Quiz Results
        if (data.quizAnalysis) {
            const stats = data.quizAnalysis;
            doc.fontSize(18).font('Helvetica-Bold').fillColor('#1e40af').text('3. Quiz Performance');
            doc.moveDown(0.3);

            doc.fontSize(12).font('Helvetica-Bold').fillColor('#1e40af')
                .text(`Score: ${stats.score}/${stats.totalQuestions} (${stats.percentage}%)`);
            doc.fontSize(11).font('Helvetica').fillColor('#333').text(stats.performanceLevel);
            doc.moveDown();

            if (stats.topicsToFocus && stats.topicsToFocus.length > 0) {
                doc.fontSize(12).font('Helvetica-Bold').fillColor('#d97706').text('Focus Areas:');
                stats.topicsToFocus.forEach(topic => {
                    doc.fontSize(11).font('Helvetica').fillColor('#333').text(`→ ${topic.topic}`);
                });
            }
        }
    }

    
    /**
     * Add footer with page numbers
     * @private
     */
    _addFooter(doc) {
        const pages = doc.bufferedPageRange().count;
        for (let i = 1; i <= pages; i++) {
            doc.switchToPage(i - 1);
            doc.fontSize(9).fillColor('#999').text(
                `Page ${i} of ${pages}`,
                50,
                doc.page.height - 30,
                { align: 'center' }
            );
        }
    }

    /**
     * Get color code based on score percentage
     * @private
     */
    _getScoreColor(percentage) {
        if (percentage >= 90) return '16a34a'; // green
        if (percentage >= 75) return '0891b2'; // cyan
        if (percentage >= 60) return 'f59e0b'; // amber
        return 'dc2626'; // red
    }
}

module.exports = new PDFExporter();
