const User = require('../models/User');
const PendingRequest = require('../models/PendingRequest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'emertech-certify-dev-secret-key-2026';

const register = async (req, res) => {
  try {
    const { 
      email, 
      password, 
      role,
      // Student fields
      fullName,
      dateOfBirth,
      program,
      enrollmentNumber,
      universityName,
      yearOfAdmission,
      yearOfGraduation,
      pgEnrollmentNumber,
      pgUniversityName,
      pgYearOfAdmission,
      pgYearOfGraduation,
      // University / Institution fields
      universityNameField,
      contactPersonName,
      contactNumber,
      officialAddress,
      city,
      state,
      country,
      accreditationId,
      coursesOffered,
      reasonForRegistration
    } = req.body;

    // Basic validation
    if (!email || !password || !role) {
      return res.status(400).json({ msg: 'Email, password, and role are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ msg: 'Password must be at least 6 characters long' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if email already exists in User collection
    let existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ msg: 'A user with this email address is already registered' });
    }

    // Check if email already exists in PendingRequest collection
    let existingRequest = await PendingRequest.findOne({ email: normalizedEmail });
    if (existingRequest) {
      if (existingRequest.status === 'pending') {
        return res.status(400).json({ 
          msg: 'An institution registration request for this email is currently pending administrative review.' 
        });
      } else if (existingRequest.status === 'rejected') {
        return res.status(400).json({ 
          msg: 'A previous registration request was rejected. Please contact the administrator.' 
        });
      }
    }

    // Hash password with bcrypt salt 10
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    if (role === 'student') {
      if (!fullName || !dateOfBirth || !program || !enrollmentNumber || !universityName || !yearOfAdmission || !yearOfGraduation) {
        return res.status(400).json({ msg: 'All core student details are required' });
      }

      const studentData = {
        email: normalizedEmail,
        password: hashedPassword,
        role: 'student',
        studentDetails: {
          fullName: fullName.trim(),
          dateOfBirth: new Date(dateOfBirth),
          program,
          enrollmentNumber: enrollmentNumber.trim(),
          universityName: universityName.trim(),
          yearOfAdmission: parseInt(yearOfAdmission, 10),
          yearOfGraduation: parseInt(yearOfGraduation, 10)
        }
      };

      if (program === 'pg') {
        if (!pgEnrollmentNumber || !pgUniversityName || !pgYearOfAdmission || !pgYearOfGraduation) {
          return res.status(400).json({ msg: 'Postgraduate fields are required for PG registration' });
        }
        
        studentData.studentDetails.pgEnrollmentNumber = pgEnrollmentNumber.trim();
        studentData.studentDetails.pgUniversityName = pgUniversityName.trim();
        studentData.studentDetails.pgYearOfAdmission = parseInt(pgYearOfAdmission, 10);
        studentData.studentDetails.pgYearOfGraduation = parseInt(pgYearOfGraduation, 10);
      }

      const newStudent = new User(studentData);
      await newStudent.save();

      return res.status(201).json({ 
        success: true,
        msg: 'Student account registered successfully! You may now sign in.',
        canLogin: true
      });

    } else if (role === 'university') {
      if (!universityNameField || !contactPersonName || !contactNumber || !officialAddress || 
          !city || !state || !country || !accreditationId || !coursesOffered) {
        return res.status(400).json({ msg: 'All institution registration fields are required' });
      }

      const coursesArray = Array.isArray(coursesOffered) 
        ? coursesOffered 
        : coursesOffered.split(',').map(c => c.trim()).filter(Boolean);

      const pendingRequestData = {
        email: normalizedEmail,
        password: hashedPassword,
        role: 'university',
        universityDetails: {
          universityName: universityNameField.trim(),
          contactPersonName: contactPersonName.trim(),
          contactNumber: contactNumber.trim(),
          officialAddress: officialAddress.trim(),
          city: city.trim(),
          state: state.trim(),
          country: country.trim(),
          accreditationId: accreditationId.trim(),
          coursesOffered: coursesArray,
          reasonForRegistration: reasonForRegistration ? reasonForRegistration.trim() : ''
        }
      };

      const newPendingRequest = new PendingRequest(pendingRequestData);
      await newPendingRequest.save();

      return res.status(201).json({ 
        success: true,
        msg: 'Institution registration request submitted successfully. It will be reviewed by the system administrator.',
        canLogin: false,
        pendingApproval: true
      });
    } else {
      return res.status(400).json({ msg: 'Invalid role specified' });
    }

  } catch (error) {
    console.error('Registration error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ msg: 'Email is already registered' });
    }
    return res.status(500).json({ msg: 'Internal server error during registration' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ msg: 'Email and password are required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@emertech.local').toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    // 1. Check for Admin Login
    if (normalizedEmail === adminEmail && password === adminPassword) {
      const adminPayload = { 
        userId: 'admin', 
        role: 'admin', 
        email: adminEmail 
      };
      const token = jwt.sign(adminPayload, JWT_SECRET, { expiresIn: '24h' });
      
      return res.json({ 
        token, 
        user: { 
          id: 'admin', 
          name: 'System Administrator', 
          email: adminEmail, 
          role: 'admin' 
        }
      });
    }

    // 2. Check Database for Student or University
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      // Check if there is an unapproved pending registration
      const pendingRequest = await PendingRequest.findOne({ email: normalizedEmail });
      if (pendingRequest && pendingRequest.status === 'pending') {
        return res.status(400).json({ 
          msg: 'Institution registration is currently pending administrator approval.',
          pendingApproval: true
        });
      } else if (pendingRequest && pendingRequest.status === 'rejected') {
        return res.status(400).json({ 
          msg: 'Institution registration was rejected. Reason: ' + (pendingRequest.rejectionReason || 'No reason provided.'),
          rejectionReason: pendingRequest.rejectionReason
        });
      }
      return res.status(400).json({ msg: 'Invalid email or password' });
    }

    // Verify bcrypt hash
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid email or password' });
    }

    // Generate JWT
    const payload = { 
      userId: user._id, 
      role: user.role, 
      email: user.email 
    };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
    
    // Prepare clean user payload
    const userData = {
      id: user._id,
      email: user.email,
      role: user.role
    };

    if (user.role === 'student' && user.studentDetails) {
      userData.name = user.studentDetails.fullName;
      userData.studentDetails = user.studentDetails;
    } else if (user.role === 'university' && user.universityDetails) {
      userData.name = user.universityDetails.universityName;
      userData.universityDetails = user.universityDetails;
      userData.universityId = user.universityDetails.universityId;
    }

    return res.json({ 
      token, 
      user: userData
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ msg: 'Internal server error during login' });
  }
};

module.exports = { register, login };
