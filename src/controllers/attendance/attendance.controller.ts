
import asyncHandler from 'express-async-handler';
import { Request, Response } from 'express';
import { ClassModel, Student } from '../../models/association.model';
import Attendance from '../../models/attendance/attendance.model';
import SuccessResponse, { getActiveSession } from '../../middlewares/helper';
import { AuthRequest } from '../../middlewares/authMiddleware';

// ✅ Record Attendance (teacher only)
export const recordAttendance = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { classId, studentId, status, date, week } = req.body;
  if (!classId || !studentId || !status || !date || !week) {
    res.status(400).json({ message: 'Please send all field' });
    return;
  }
  const teacherId = (req as any).user?.id; // assuming JWT middleware sets req.user

  const classInstance = await ClassModel.findByPk(classId);
  if (!classInstance) {
    res.status(404).json({ message: 'Class not found' });
    return;
  }

  const student = await Student.findByPk(studentId);
  if (!student) {
    res.status(404).json({ message: 'Student not found' });
    return;
  }

  // Check if teacher is assigned to this class
  if (classInstance.teacherId !== teacherId) {
    res.status(400).json({ message: 'You are not authorized to mark attendance for this class' });
    return;
  }

  // Prevent duplicate attendance for same student/date
  const existing = await Attendance.findOne({ where: { studentId, date } });
  if (existing) {
    res.status(400).json({ message: 'Attendance already recorded for this student today' });
    return;
  }
  const activeSession = await getActiveSession();
  const attendance = await Attendance.create({
    studentId,
    classId,
    teacherId,
    date,
    week,
    status,
    sessionId:activeSession?.id
  });

  new SuccessResponse("Attendance recorded successfully", { attendance }).sendResponse(res);
});

// ✅ Get class attendance summary
export const getClassAttendance = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { classId } = req.params;
  const records = await Attendance.findAll({
    where: { classId },
    include: [{ association: "student", attributes: ["id", "firstName","lastName", "email"] }],
    order: [["date", "DESC"]],
  });

  new SuccessResponse("Class attendance summary retrieved", { records }).sendResponse(res);
});

// ✅ Get student attendance record 
export const getStudentAttendance = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { studentId } = req.params;

  const records = await Attendance.findAll({
    where: { studentId },
    include: [{ association: "class", attributes: ["id", "name"] }],
    order: [["date", "DESC"]],
  });

  new SuccessResponse("Student attendance records retrieved", { records }).sendResponse(res);
});

// ✅ Update attendance record
export const updateAttendance = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id, status } = req.body;

  const record = await Attendance.findByPk(id);
  if (!record) {
    res.status(404).json({ message: 'Attendance record not found' });
    return;
  }

  await record.update({ status });

  new SuccessResponse("Attendance updated successfully", { record }).sendResponse(res);
});