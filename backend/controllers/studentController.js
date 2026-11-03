const User = require('../models/User');
const Certificate = require('../models/Certificate');
const path = require('path');
const fs = require('fs');

// Get student profile
const getStudentProfile = async (req, res) => {
  try {
    const student = await User.findById(req.user.userId).select('-password');
    
    if (!student || student.role !== 'student') {
      return res.status(404).json({ 
        success: false,
        msg: 'Student profile not found' 
      });
    }

    res.json({
      success: true,
      data: {
        id: student._id,
        email: student.email,
        role: student.role,
        studentDetails: student.studentDetails,
        createdAt: student.createdAt
      }
    });
  } catch (error) {
    console.error('Error fetching student profile:', error);
    res.status(500).json({ 
      success: false,
      msg: 'Server error while fetching student profile' 
    });
  }
};

// Update student profile (preserves immutable institutional identifiers)
const updateStudentProfile = async (req, res) => {
  try {
    const { studentDetails } = req.body;
    
    const student = await User.findById(req.user.userId);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ 
        success: false,
        msg: 'Student not found' 
      });
    }

    if (studentDetails) {
      // Retain academic identifiers
      const immutableEnrollment = student.studentDetails?.enrollmentNumber;
      const immutableUni = student.studentDetails?.universityName;

      student.studentDetails = {
        ...student.studentDetails?.toObject(),
        ...studentDetails,
        enrollmentNumber: immutableEnrollment || studentDetails.enrollmentNumber,
        universityName: immutableUni || studentDetails.universityName
      };
    }

    await student.save();

    res.json({
      success: true,
      msg: 'Profile updated successfully',
      data: {
        id: student._id,
        email: student.email,
        role: student.role,
        studentDetails: student.studentDetails
      }
    });
  } catch (error) {
    console.error('Error updating student profile:', error);
    res.status(500).json({ 
      success: false,
      msg: 'Server error while updating profile' 
    });
  }
};

// Get all certificates for the authenticated student (both issued & revoked)
const getStudentCertificates = async (req, res) => {
  try {
    const student = await User.findById(req.user.userId);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ 
        success: false,
        msg: 'Student not found' 
      });
    }

    const certificates = await Certificate.find({ 
      studentEmail: student.email.toLowerCase() 
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: certificates,
      count: certificates.length
    });
  } catch (error) {
    console.error('Error fetching student certificates:', error);
    res.status(500).json({ 
      success: false,
      msg: 'Server error while fetching certificates' 
    });
  }
};

// Get single certificate details
const getCertificateDetails = async (req, res) => {
  try {
    const { certificateId } = req.params;
    const student = await User.findById(req.user.userId);
    
    if (!student || student.role !== 'student') {
      return res.status(404).json({ 
        success: false,
        msg: 'Student not found' 
      });
    }

    const certificate = await Certificate.findOne({
      _id: certificateId,
      studentEmail: student.email.toLowerCase()
    });

    if (!certificate) {
      return res.status(404).json({ 
        success: false,
        msg: 'Certificate not found or not authorized' 
      });
    }

    res.json({
      success: true,
      data: certificate
    });
  } catch (error) {
    console.error('Error fetching certificate details:', error);
    res.status(500).json({ 
      success: false,
      msg: 'Server error while retrieving certificate details' 
    });
  }
};

// Download certificate PDF
const downloadCertificate = async (req, res) => {
  try {
    const { certificateId } = req.params;
    const student = await User.findById(req.user.userId);

    const certificate = await Certificate.findOne({
      _id: certificateId,
      studentEmail: student.email.toLowerCase()
    });

    if (!certificate || !certificate.pdfPath) {
      return res.status(404).json({ success: false, msg: 'Certificate PDF not available' });
    }

    const fullPdfPath = path.join(__dirname, '..', certificate.pdfPath);
    if (!fs.existsSync(fullPdfPath)) {
      return res.status(404).json({ success: false, msg: 'Certificate file missing from storage' });
    }

    res.download(fullPdfPath, `${certificate.blockchainId}.pdf`);
  } catch (err) {
    console.error('Download error:', err);
    res.status(500).json({ success: false, msg: 'Error downloading certificate' });
  }
};

module.exports = {
  getStudentProfile,
  updateStudentProfile,
  getStudentCertificates,
  getCertificateDetails,
  downloadCertificate
};
