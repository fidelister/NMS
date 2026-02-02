import { Express, Router, Request, Response } from "express";
import { adminOnly, adminOrTeacher, protect, teacherOnly } from "../../middlewares/authMiddleware";
import { activeSession, assignPrimaryTeacherToClass, assignStudentToClass, assignTeacherToSubject, changeAdminPassword, getAdminProfile, getAllClasses, getStudentsByClass, getSubjectsByClass, getTeacherClasses, getTeacherSubjects, loginAdmin, registerAdmin } from "../../controllers/auth/admin/admin.controller";
import { createClass, deleteClass } from "../../controllers/class/class.controller";
import { createSubject } from "../../controllers/subject/subject.controller";
import { registerTeacher } from "../../controllers/auth/teacher/teacher.controller";
import { getStudentAttendance } from "../../controllers/attendance/attendance.controller";
import { generateReportCards, getClassReportCards, getClassResults, getStudentReportCard, regenerateReportCards } from "../../controllers/report_card/report_card.controller";
import { createSession, getAllSessions, getSessionDetails } from "../../controllers/session/session.controller";
import { createOrUpdatePsychomotor, getClassPsychomotor, getStudentPsychomotor } from "../../controllers/report_card/psychomotor_tests.controller";
import { createTimetable, getClassTimetable, updateTimetable } from "../../controllers/timetable/timetable.controller";

const adminRoutes: Router = Router();

adminRoutes.post('/register', registerAdmin);
adminRoutes.post('/login', loginAdmin);
adminRoutes.post('/create-session', protect, adminOnly, createSession);
adminRoutes.get('/sessions', protect, adminOnly, getAllSessions);
adminRoutes.get('/active-session', protect, adminOnly, activeSession);

adminRoutes.get(
    '/sessions/:sessionId/details',
    protect,
    adminOnly,
    getSessionDetails
);
adminRoutes.post('/changePassword', protect, adminOnly, changeAdminPassword);
adminRoutes.post('/add-teacher', protect, adminOnly, registerTeacher);
adminRoutes.post('/create-class', protect, adminOnly, createClass);
adminRoutes.delete("/class/:id", protect, adminOrTeacher, deleteClass);
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
adminRoutes.post("/generate", protect, adminOrTeacher, generateReportCards);
adminRoutes.post("/regenerate", protect, adminOrTeacher, regenerateReportCards);
adminRoutes.get("/class-report/:classId", protect, adminOrTeacher, getClassReportCards);
adminRoutes.get("/student-report/:studentId", protect, adminOrTeacher, getStudentReportCard);
adminRoutes.get("/class-results", protect, adminOrTeacher, getClassResults);
//psychomotor details
adminRoutes.post("/psychomotor", protect, adminOrTeacher, createOrUpdatePsychomotor);
adminRoutes.get("/psychomotor/:studentId", protect, adminOrTeacher, getStudentPsychomotor);
adminRoutes.get("/class-psychomotor/:classId", protect, adminOrTeacher, getClassPsychomotor);
//timetable
adminRoutes.post("/timetable", protect, adminOnly, createTimetable)
adminRoutes.get("/timetable/:classId/:term", protect, adminOnly, getClassTimetable)
adminRoutes.patch("/timetable/:id", protect, adminOnly, updateTimetable)    

export default adminRoutes;
