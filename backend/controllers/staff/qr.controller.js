// backend/controllers/staff/qr.controller.js
import { asyncHandler } from '../../middleware/asyncHandler.middleware.js';
import StaffAttendanceService from '../../services/staff/attendance.service.js';
import { getDB } from '../../config/database.js'; // डेटाबेस कनेक्शन के लिए
import jwt from 'jsonwebtoken'; // JWT टोकन को डिकोड करने के लिए
import dotenv from 'dotenv'; // पर्यावरण चर (environment variables) लोड करने के लिए
import { format } from 'date-fns'; // तारीख को फॉर्मेट करने के लिए

dotenv.config(); // पर्यावरण चर लोड करें

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey'; // सुनिश्चित करें कि यह आपके JWT सीक्रेट से मेल खाता है

/**
 * @desc स्कैन किए गए QR कोड डेटा का उपयोग करके उपस्थिति (attendance) चिह्नित करें
 * @route POST /api/staff/attendance/mark-qr
 * @access Private/Staff
 */
export const markAttendanceByQr = asyncHandler(async (req, res) => {
  const { studentUserId: qrCodeToken, mealType } = req.body; // studentUserId अब QR कोड टोकन है

  if (!qrCodeToken || !mealType) {
    return res.status(400).json({ success: false, message: 'QR कोड डेटा और भोजन का प्रकार आवश्यक हैं।' });
  }

  if (!['breakfast', 'lunch', 'dinner'].includes(mealType)) {
      return res.status(400).json({ success: false, message: 'अमान्य भोजन प्रकार प्रदान किया गया।' });
  }

  // प्रमाणित स्टाफ उपयोगकर्ता का ID प्राप्त करें
  const staffUserId = req.user.id;
  const ipAddress = req.ip; // Express का req.ip क्लाइंट का IP देता है
  const deviceInfo = req.headers['user-agent']; // उपयोगकर्ता-एजेंट स्ट्रिंग

  let studentIdFromQr;
  try {
    // QR कोड टोकन को सत्यापित (verify) और डिकोड करें
    // Type assertion 'as { userId: number; date: string; mealType: string; exp: number; }' removed
    const decodedQr = jwt.verify(qrCodeToken, JWT_SECRET);

    // जांचें कि क्या QR कोड समाप्त हो गया है
    if (decodedQr.exp * 1000 < Date.now()) {
        return res.status(400).json({ success: false, message: 'QR कोड समाप्त हो गया है। कृपया छात्र से एक नया QR कोड जनरेट करने के लिए कहें।' });
    }

    // जांचें कि क्या QR कोड में भोजन का प्रकार अनुरोधित भोजन के प्रकार से मेल खाता है
    if (decodedQr.mealType !== mealType) {
        return res.status(400).json({ success: false, message: 'QR कोड में भोजन का प्रकार चयनित भोजन के प्रकार से मेल नहीं खाता है।' });
    }

    // जांचें कि क्या QR कोड में तारीख आज की तारीख से मेल खाती है
    const todayFormatted = format(new Date(), 'yyyy-MM-dd');
    if (decodedQr.date !== todayFormatted) {
        return res.status(400).json({ success: false, message: 'QR कोड आज की तारीख के लिए मान्य नहीं है।' });
    }

    studentIdFromQr = decodedQr.userId; // डिकोड किए गए टोकन से वास्तविक userId निकालें

  } catch (error) { // Type annotation ': any' removed
    console.error('QR कोड सत्यापन त्रुटि:', error);
    if (error.name === 'TokenExpiredError') {
        return res.status(400).json({ success: false, message: 'QR कोड समाप्त हो गया है। कृपया छात्र से एक नया QR कोड जनरेट करने के लिए कहें।' });
    }
    if (error.name === 'JsonWebTokenError') {
        return res.status(400).json({ success: false, message: 'अमान्य QR कोड। कृपया सुनिश्चित करें कि एक वैध QR कोड स्कैन किया गया है।' });
    }
    return res.status(500).json({ success: false, message: 'QR कोड को संसाधित करने में त्रुटि: ' + error.message });
  }

  try {
    const result = await StaffAttendanceService.markStudentAttendance(
      studentIdFromQr, // निकाला गया पूर्णांक userId पास करें
      mealType,
      staffUserId,
      ipAddress,
      deviceInfo
    );
    res.status(201).json({ success: true, message: result.message });
  } catch (error) { // Type annotation ': any' removed
    // जांचें कि क्या त्रुटि अद्वितीय बाधा उल्लंघन (duplicate entry) के कारण है
    // डुप्लिकेट एंट्री के लिए MySQL त्रुटि कोड आमतौर पर 1062 है
    if (error.message.includes('इस भोजन के लिए उपस्थिति') || (error.code === 'ER_DUP_ENTRY')) {
      return res.status(409).json({ success: false, message: error.message }); // संघर्ष (Conflict)
    }
    console.error('उपस्थिति चिह्नित करने में त्रुटि:', error);
    res.status(500).json({ success: false, message: error.message || 'उपस्थिति चिह्नित करने में विफल रहा।' });
  }
});
