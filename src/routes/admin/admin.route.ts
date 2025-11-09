import { Express, Router, Request, Response } from "express";
import { adminOnly, protect } from "../../middlewares/authMiddleware";
import { assignPrimaryTeacherToClass, assignStudentToClass, assignTeacherToSubject, changeAdminPassword, getAdminProfile, getAllClasses, getStudentsByClass, getSubjectsByClass, getTeacherClasses, getTeacherSubjects, loginAdmin, registerAdmin } from "../../controllers/auth/admin/admin.controller";
import { createClass } from "../../controllers/class/class.controller";
import { createSubject } from "../../controllers/subject/subject.controller";
import { registerTeacher } from "../../controllers/auth/teacher/teacher.controller";
import { getStudentAttendance } from "../../controllers/attendance/attendance.controller";
import { generateReportCards, getClassReportCards, getStudentReportCard} from "../../controllers/report_card/report_card.controller";

const adminRoutes: Router = Router();

adminRoutes.post('/register', registerAdmin);
adminRoutes.post('/login', loginAdmin);
adminRoutes.post('/changePassword', protect, adminOnly, changeAdminPassword);
adminRoutes.post('/add-teacher', protect, adminOnly, registerTeacher);
adminRoutes.post('/create-class', protect, adminOnly, createClass);
adminRoutes.post('/create-subject', protect, adminOnly, createSubject);
adminRoutes.post('/student-class', protect, adminOnly, assignStudentToClass);
adminRoutes.post('/teacher-subject', protect, adminOnly, assignTeacherToSubject);
adminRoutes.post('/teacher-class', protect, adminOnly, assignPrimaryTeacherToClass);
adminRoutes.get('/profile', protect, getAdminProfile);
adminRoutes.get('/studentsByClass/:classId', protect, adminOnly, getStudentsByClass);
adminRoutes.get("/student/:studentId", protect, adminOnly, getStudentAttendance);
adminRoutes.get('/allClasses', protect, adminOnly, getAllClasses);
adminRoutes.get('/subjectsByClass/:classId', protect, adminOnly, getSubjectsByClass);
adminRoutes.get("/teacherClass/:teacherId", protect, adminOnly, getTeacherClasses);
adminRoutes.get("/teacherSubjects/:teacherId", protect, adminOnly, getTeacherSubjects);
//report card
adminRoutes.post("/generate", protect, adminOnly, generateReportCards);
adminRoutes.get("/class-report/:classId", protect, adminOnly, getClassReportCards);
adminRoutes.get("/student-report/:studentId", protect, adminOnly, getStudentReportCard);
// adminRoutes.get("/student/:studentId", protect, adminOnly, getStudentReportCard);

export default adminRoutes;
