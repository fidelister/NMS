import { Express, Router, Request, Response } from "express";
import { adminOnly, adminOrTeacher, protect, teacherOnly } from "../../middlewares/authMiddleware";
import { changeTeacherPassword, deleteTeacher, getAllTeachers, getTeacherById, getTeacherProfile, loginTeacher, registerTeacher, updateTeacherDetails } from "../../controllers/auth/teacher/teacher.controller";
import { getClassAttendance, getStudentAttendance, recordAttendance, updateAttendance } from "../../controllers/attendance/attendance.controller";
import { createClassTest, getClassTestsByClass, getClassTestsByStudent, updateClassTest } from "../../controllers/classTests/classTests.controller";
import { createExam, getAllExams, getExamDetails, getExamResults, updateExamResult, uploadExamResults } from "../../controllers/exam/exam.controller";
import { deleteClass } from "../../controllers/class/class.controller";
import { getTeacherTimetable } from "../../controllers/timetable/timetable.controller";

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
teacherRoutes.post("/record", protect, adminOrTeacher,recordAttendance);
teacherRoutes.get("/class/:classId", protect, adminOrTeacher, getClassAttendance);
teacherRoutes.get("/student/:studentId", protect, adminOrTeacher, getStudentAttendance);
teacherRoutes.put("/update-attendance", protect, adminOrTeacher, updateAttendance);
// class test
teacherRoutes.post("/upload-test", protect,adminOrTeacher,createClassTest);
teacherRoutes.get("/getClassTestsByClass/:classId", protect, adminOrTeacher, getClassTestsByClass);
teacherRoutes.get("/getClassTestsByStudent/:studentId", protect, adminOrTeacher, getClassTestsByStudent);
teacherRoutes.put("/updateClassTest/:testId", protect, adminOrTeacher, updateClassTest);
// Exams    
teacherRoutes.post("/api/exams",protect, adminOrTeacher, createExam);
teacherRoutes.get("/api/exams",protect,adminOrTeacher, getAllExams);
teacherRoutes.get("/api/exams/:id",protect, adminOrTeacher,getExamDetails);
teacherRoutes.post("/api/exams/:id/results",protect, adminOrTeacher,uploadExamResults);
teacherRoutes.get("/api/exams/:id/results",protect, adminOrTeacher,getExamResults);
teacherRoutes.put("/api/exams/:id/results/:resultId",protect, adminOrTeacher,updateExamResult);

teacherRoutes.get("/", protect, adminOrTeacher, getTeacherTimetable);

export default teacherRoutes;
