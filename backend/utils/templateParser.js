const fs = require('fs');

/**
 * Extract placeholders from EJS template
 * Supports: <%= variable %>, <%- variable %>
 * Also detects array patterns like subjects.forEach
 */
function extractPlaceholdersFromTemplate(templatePath) {
  try {
    const content = fs.readFileSync(templatePath, 'utf-8');
    const placeholders = new Set();
    const arrayFields = new Set();

    // Match <%= variable %> and <%- variable %>
    const singleVarRegex = /<%[=-]\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*%>/g;
    let match;

    while ((match = singleVarRegex.exec(content)) !== null) {
      const varName = match[1];
      // Skip EJS keywords and common loop variables
      if (!['if', 'else', 'endif', 'forEach', 'function', 'sub', 'item', 'index'].includes(varName)) {
        placeholders.add(varName);
      }
    }

    // Match array patterns: array.forEach, array.map, etc.
    const arrayRegex = /<%\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\.\s*forEach\s*\(/g;
    while ((match = arrayRegex.exec(content)) !== null) {
      arrayFields.add(match[1]);
      placeholders.delete(match[1]); // Remove from single placeholders
    }

    // Match nested properties like sub.name, sub.grade
    const nestedRegex = /<%[=-]\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\.\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*%>/g;
    const nestedProperties = {};

    while ((match = nestedRegex.exec(content)) !== null) {
      const parentVar = match[1];
      const childVar = match[2];
      
      if (!nestedProperties[parentVar]) {
        nestedProperties[parentVar] = new Set();
      }
      nestedProperties[parentVar].add(childVar);
    }

    // Convert to structured format
    const result = [];

    // Add single placeholders
    placeholders.forEach(name => {
      result.push({
        name,
        label: formatLabel(name),
        type: inferType(name),
        required: isMandatoryField(name)
      });
    });

    // Add array fields with their nested properties
    arrayFields.forEach(arrayName => {
      const properties = nestedProperties[arrayName] || new Set();
      result.push({
        name: arrayName,
        label: formatLabel(arrayName),
        type: 'array',
        required: true,
        arrayFields: Array.from(properties).map(prop => ({
          name: prop,
          label: formatLabel(prop),
          type: inferType(prop),
          required: true
        }))
      });
    });

    return result;
  } catch (err) {
    console.error('Error parsing template:', err);
    throw err;
  }
}

/**
 * Convert camelCase to Title Case
 * Example: studentName -> Student Name
 */
function formatLabel(fieldName) {
  return fieldName
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

/**
 * Infer field type based on field name
 */
function inferType(fieldName) {
  const lowerName = fieldName.toLowerCase();
  
  if (lowerName.includes('date')) return 'date';
  if (lowerName.includes('year')) return 'number';
  if (lowerName.includes('marks')) return 'number';
  if (lowerName.includes('semester')) return 'number';
  if (lowerName.includes('email')) return 'email';
  if (lowerName.includes('phone') || lowerName.includes('mobile')) return 'tel';
  
  return 'text';
}

/**
 * Check if field is mandatory
 */
function isMandatoryField(fieldName) {
  const mandatoryFields = ['studentName', 'studentEmail', 'registerNo', 'universityName', 'blockchainId', 'issueDate', 'qrCodeData'];
  return mandatoryFields.includes(fieldName);
}

module.exports = {
  extractPlaceholdersFromTemplate,
  formatLabel,
  inferType,
  isMandatoryField
};