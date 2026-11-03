
// module.exports = { uploadTemplate, listTemplates };
const Template = require('../models/Template');

async function uploadTemplate(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: 'No file uploaded' });
    }

    const newTemplate = new Template({
      filename: req.file.filename,
      originalname: req.file.originalname,
      uploadDate: new Date()
    });

    await newTemplate.save();

    res.json({ msg: 'File uploaded and saved', template: newTemplate });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ msg: 'Internal Server Error' });
  }
}

async function getTemplates(req, res) {
  try {
    const templates = await Template.find();
    res.json(templates);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
}

module.exports = { uploadTemplate, getTemplates };
