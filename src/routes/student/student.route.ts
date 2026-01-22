import { Express, Router, Request, Response } from "express";
import { adminOnly, protect } from "../../middlewares/authMiddleware";
import { changeStudentPassword, deleteStudent, getAllStudents, getMyClassTests, getMyExamResults, getStudentAssignments, getStudentById, getStudentDashboardStats, getStudentProfile, loginStudent, registerStudent, updateStudentDetails } from "../../controllers/auth/student/student.controller";
import { getExamResults } from "../../controllers/exam/exam.controller";
import { getStudentCard } from "../../controllers/report_card/report_card.controller";
import { getStudentPsy } from "../../controllers/report_card/psychomotor_tests.controller";
import { getStudentTimetable } from "../../controllers/timetable/timetable.controller";

const studentRoutes: Router = Router();
studentRoutes.get("/student-report", protect, getStudentCard);
studentRoutes.get("/student-psy", protect, getStudentPsy);
studentRoutes.get('/class', protect, getMyClassTests);  
studentRoutes.get('/exam', protect, getMyExamResults);  
studentRoutes.post('/register', protect, adminOnly, registerStudent);
studentRoutes.post('/changePassword', protect, changeStudentPassword);
studentRoutes.post('/login', loginStudent);
studentRoutes.get('/profile', protect, getStudentProfile);
studentRoutes.get("/students",protect,adminOnly, getAllStudents);
studentRoutes.get("/:id", protect,adminOnly,getStudentById);
studentRoutes.delete("/:id", protect,adminOnly,deleteStudent);
studentRoutes.put("/update", protect, adminOnly, updateStudentDetails);
studentRoutes.get('/', protect, getStudentDashboardStats);  
studentRoutes.get('/timetable/classes', protect, getStudentTimetable);  
studentRoutes.get('/assignment/student', protect, getStudentAssignments);  


export default studentRoutes;
