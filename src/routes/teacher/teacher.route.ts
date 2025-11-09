import { Express, Router, Request, Response } from "express";
import { adminOnly, protect, teacherOnly } from "../../middlewares/authMiddleware";
import { changeTeacherPassword, deleteTeacher, getAllTeachers, getTeacherById, getTeacherProfile, loginTeacher, registerTeacher, updateTeacherDetails } from "../../controllers/auth/teacher/teacher.controller";
import { getClassAttendance, getStudentAttendance, recordAttendance, updateAttendance } from "../../controllers/attendance/attendance.controller";
import { createClassTest, getClassTestsByClass, getClassTestsByStudent, updateClassTest } from "../../controllers/classTests/classTests.controller";
import { createExam, getAllExams, getExamDetails, getExamResults, updateExamResult, uploadExamResults } from "../../controllers/exam/exam.controller";

const teacherRoutes: Router = Router();

teacherRoutes.post('/register',protect,adminOnly, registerTeacher);
teacherRoutes.post('/login', loginTeacher);
teacherRoutes.get('/profile',protect, getTeacherProfile);
teacherRoutes.get("/teachers",protect,adminOnly, getAllTeachers);
teacherRoutes.get("/:id", protect,adminOnly,getTeacherById);
teacherRoutes.delete("/:id",protect,adminOnly, deleteTeacher);
teacherRoutes.put('/update', protect, adminOnly, updateTeacherDetails);
teacherRoutes.post('/changePassword',protect, changeTeacherPassword);
//attendance
teacherRoutes.post("/record", protect, teacherOnly, recordAttendance);
teacherRoutes.get("/class/:classId", protect, getClassAttendance);
teacherRoutes.get("/student/:studentId", protect, teacherOnly, getStudentAttendance);
teacherRoutes.put("/update-attendance", protect, teacherOnly, updateAttendance);
// class test
teacherRoutes.post("/upload-test", protect, teacherOnly, createClassTest);
teacherRoutes.get("/getClassTestsByClass/:classId", protect, teacherOnly, getClassTestsByClass);
teacherRoutes.get("/getClassTestsByStudent/:studentId", protect, teacherOnly, getClassTestsByStudent);
teacherRoutes.put("/updateClassTest/:testId", protect, teacherOnly, updateClassTest);
// Exams    
teacherRoutes.post("/api/exams",protect, teacherOnly, createExam);
teacherRoutes.get("/api/exams",protect, teacherOnly, getAllExams);
teacherRoutes.get("/api/exams/:id",protect, teacherOnly,getExamDetails);
teacherRoutes.post("/api/exams/:id/results",protect, teacherOnly,uploadExamResults);
teacherRoutes.get("/api/exams/:id/results",protect, teacherOnly,getExamResults);
teacherRoutes.put("/api/exams/:id/results/:resultId",protect, teacherOnly,updateExamResult);
export default teacherRoutes;
