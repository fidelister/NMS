import { Express, Router, Request, Response } from "express";
import adminRoutes from "./admin/admin.route";
import studentRoutes from "./student/student.route";
import teacherRoutes from "./teacher/teacher.route";
const rootRoutes: Router = Router();

rootRoutes.use('/admin', adminRoutes)
rootRoutes.use('/student', studentRoutes)
rootRoutes.use('/teacher', teacherRoutes)

// ✅ Health check route
rootRoutes.get('/healthz', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

export default rootRoutes;
