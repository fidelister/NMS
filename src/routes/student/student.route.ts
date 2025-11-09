import { Express, Router, Request, Response } from "express";
import { adminOnly, protect } from "../../middlewares/authMiddleware";
import { changeStudentPassword, deleteStudent, getAllStudents, getStudentById, getStudentProfile, loginStudent, registerStudent, updateStudentDetails } from "../../controllers/auth/student/student.controller";

const studentRoutes: Router = Router();

studentRoutes.post('/register', protect, adminOnly, registerStudent);
studentRoutes.post('/changePassword', protect, changeStudentPassword);
studentRoutes.post('/login', loginStudent);
studentRoutes.get('/profile', protect, getStudentProfile);
studentRoutes.get("/students",protect,adminOnly, getAllStudents);
studentRoutes.get("/:id", protect,adminOnly,getStudentById);
studentRoutes.delete("/:id", protect,adminOnly,deleteStudent);
studentRoutes.put("/update", protect, adminOnly, updateStudentDetails);

export default studentRoutes;
