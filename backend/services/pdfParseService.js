/**
 * PDF Parsing Service
 * Converts PDF content to JSON format for structured processing
 */

const fs = require('fs');
const pdf = require('pdf-parse');

/**
 * Extract text and metadata from PDF file
 * @param {string} filePath - Path to the PDF file
 * @returns {Promise<Object>} - Extracted PDF data in JSON format
 */
exports.extractPdfToJson = async (filePath) => {
    try {
        const dataBuffer = fs.readFileSync(filePath);
        const pdfData = await pdf(dataBuffer);

        return {
            metadata: {
                title: pdfData.info?.Title || 'Unknown',
                author: pdfData.info?.Author || 'Unknown',
                subject: pdfData.info?.Subject || 'Unknown',
                pages: pdfData.numpages,
                creationDate: pdfData.info?.CreationDate || new Date(),
            },
            pages: pdfData.pages?.map((page, index) => ({
                pageNumber: index + 1,
                text: page.getTextContent
                    ? page.getTextContent().items.map(item => item.str).join('')
                    : '',
                content: page.content || '',
            })) || [],
            fullText: pdfData.text || '',
            version: pdfData.version,
        };
    } catch (error) {
        console.error('PDF Parsing Error:', error.message);
        throw new Error(`Failed to parse PDF: ${error.message}`);
    }
};

/**
 * Extract only the full text from PDF
 * @param {string} filePath - Path to the PDF file
 * @returns {Promise<string>} - Extracted text
 */
exports.extractPdfText = async (filePath) => {
    try {
        const dataBuffer = fs.readFileSync(filePath);
        const pdfData = await pdf(dataBuffer);
        return pdfData.text || '';
    } catch (error) {
        console.error('PDF Text Extraction Error:', error.message);
        throw new Error(`Failed to extract PDF text: ${error.message}`);
    }
};

/**
 * Get PDF file size in MB
 * @param {string} filePath - Path to the PDF file
 * @returns {number} - File size in MB
 */
exports.getPdfFileSize = (filePath) => {
    const stats = fs.statSync(filePath);
    return (stats.size / (1024 * 1024)).toFixed(2);
};
