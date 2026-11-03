const User = require('../models/User');
const PendingRequest = require('../models/PendingRequest');
const Certificate = require('../models/Certificate');

// Generate university ID sequence (un01, un02, etc.)
const generateUniversityId = async () => {
  try {
    const count = await User.countDocuments({ 
      role: 'university',
      'universityDetails.approved': true 
    });
    
    const nextNumber = (count + 1).toString().padStart(2, '0');
    return `un${nextNumber}`;
  } catch (error) {
    console.error('Generate university ID error:', error);
    throw error;
  }
};

const getPendingRequests = async (req, res) => {
  try {
    const requests = await PendingRequest.find({ status: 'pending' }).sort({ createdAt: -1 });
    res.json({ success: true, requests });
  } catch (error) {
    console.error('Get pending requests error:', error);
    res.status(500).json({ success: false, msg: 'Server error retrieving pending requests' });
  }
};

const getApprovedUniversities = async (req, res) => {
  try {
    const universities = await User.find({ 
      role: 'university',
      'universityDetails.approved': true 
    }).select('-password');

    // Aggregate certificate counts per university ID
    const counts = await Certificate.aggregate([
      { $group: { _id: '$universityId', count: { $sum: 1 } } }
    ]);
    const countMap = {};
    counts.forEach(c => {
      if (c._id) countMap[c._id] = c.count;
    });
    
    const universitiesWithStats = universities.map(uni => {
      const uId = uni.universityDetails?.universityId;
      return {
        ...uni.toObject(),
        certificateCount: countMap[uId] || 0
      };
    });
    
    res.json({ success: true, universities: universitiesWithStats });
  } catch (error) {
    console.error('Get approved universities error:', error);
    res.status(500).json({ success: false, msg: 'Server error retrieving approved universities' });
  }
};

const approveUniversity = async (req, res) => {
  try {
    const { requestId } = req.params;
    
    const pendingRequest = await PendingRequest.findById(requestId);
    if (!pendingRequest) {
      return res.status(404).json({ success: false, msg: 'Pending request not found' });
    }
    
    if (pendingRequest.status !== 'pending') {
      return res.status(400).json({ success: false, msg: 'Request has already been processed' });
    }
    
    const universityId = await generateUniversityId();
    
    // Create user in main User collection
    const userData = {
      email: pendingRequest.email,
      password: pendingRequest.password,
      role: 'university',
      universityDetails: {
        ...pendingRequest.universityDetails.toObject(),
        approved: true,
        approvedBy: req.user?.userId || 'admin',
        approvalDate: new Date(),
        universityId: universityId
      }
    };
    
    const newUser = new User(userData);
    await newUser.save();
    
    // Update pending request status
    pendingRequest.status = 'approved';
    pendingRequest.reviewedBy = req.user?.userId || 'admin';
    pendingRequest.reviewDate = new Date();
    pendingRequest.universityId = universityId;
    await pendingRequest.save();
    
    res.json({
      success: true,
      msg: `Institution "${newUser.universityDetails.universityName}" approved successfully with ID ${universityId}`,
      universityId: universityId,
      university: {
        id: newUser._id,
        name: newUser.universityDetails.universityName,
        email: newUser.email,
        universityId: universityId
      }
    });
    
  } catch (error) {
    console.error('Approve university error:', error);
    res.status(500).json({ success: false, msg: 'Server error while approving institution' });
  }
};

const rejectUniversity = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { reason } = req.body;
    
    const pendingRequest = await PendingRequest.findById(requestId);
    if (!pendingRequest) {
      return res.status(404).json({ success: false, msg: 'Pending request not found' });
    }
    
    if (pendingRequest.status !== 'pending') {
      return res.status(400).json({ success: false, msg: 'Request has already been processed' });
    }
    
    pendingRequest.status = 'rejected';
    pendingRequest.reviewedBy = req.user?.userId || 'admin';
    pendingRequest.reviewDate = new Date();
    pendingRequest.rejectionReason = reason || 'Requirements not met';
    await pendingRequest.save();
    
    res.json({
      success: true,
      msg: 'Institution registration request rejected',
      reason: pendingRequest.rejectionReason
    });
    
  } catch (error) {
    console.error('Reject university error:', error);
    res.status(500).json({ success: false, msg: 'Server error while rejecting institution' });
  }
};

const removeUniversity = async (req, res) => {
  try {
    const { universityId } = req.params;
    
    const university = await User.findById(universityId);
    if (!university || university.role !== 'university') {
      return res.status(404).json({ success: false, msg: 'Institution not found' });
    }
    
    await User.findByIdAndDelete(universityId);
    
    res.json({ success: true, msg: 'Institution removed successfully' });
    
  } catch (error) {
    console.error('Remove university error:', error);
    res.status(500).json({ success: false, msg: 'Server error while removing institution' });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const [
      totalUniversities,
      totalStudents,
      totalCertificates,
      totalRevoked,
      pendingRequests
    ] = await Promise.all([
      User.countDocuments({ role: 'university', 'universityDetails.approved': true }),
      User.countDocuments({ role: 'student' }),
      Certificate.countDocuments({ status: 'issued' }),
      Certificate.countDocuments({ status: 'revoked' }),
      PendingRequest.countDocuments({ status: 'pending' })
    ]);
    
    res.json({
      success: true,
      stats: {
        totalUniversities,
        totalStudents,
        totalCertificates,
        totalRevoked,
        pendingRequests
      }
    });
    
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ success: false, msg: 'Server error while fetching dashboard statistics' });
  }
};

module.exports = {
  getPendingRequests,
  getApprovedUniversities,
  approveUniversity,
  rejectUniversity,
  removeUniversity,
  getDashboardStats
};
