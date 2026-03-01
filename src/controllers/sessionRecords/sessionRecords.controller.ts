import asyncHandler from 'express-async-handler';
import { Request, Response } from 'express';
import Exam from '../../models/Exams/exam.model';
import SuccessResponse, { getActiveAcademicPeriod } from '../../middlewares/helper';
import ExamResult from '../../models/Exams/examResults.model';
import Attendance from '../../models/attendance/attendance.model';
import Assignment from '../../models/assignment/assignment.model';
import ClassTest from '../../models/ClassTests/classTests.model';
import ReportCard from '../../models/report_card/report_card.model';
import Timetable from '../../models/timetable/timetable.model';
import { ClassModel, Subject, Teacher } from '../../models/association.model';

export const getExamsBySession = asyncHandler(
  async (req: Request, res: Response) => {
 const { session, term } = await getActiveAcademicPeriod();

    if (!session || !term) {
      res.status(400).json({ message: "No active academic period found" });
      return;
    }
    const exams = await Exam.findAll({
      where: { sessionId: session.id },
      include: ["subject"],
      order: [["createdAt", "DESC"]],
    });

    new SuccessResponse("Exams fetched", exams).sendResponse(res);
  }
);
export const getExamResultsBySession = asyncHandler(
  async (req: Request, res: Response) => {
    const { session, term } = await getActiveAcademicPeriod();

    if (!session || !term) {
      res.status(400).json({ message: "No active academic period found" });
      return;
    }

    const results = await ExamResult.findAll({
      where: { sessionId: session.id },
      include: [{
          association: "student",
          attributes: ["id", "firstName", "lastName", "gender", "email"],
        }, {
          association: "subject",
          attributes: ["id", "name"],
        }, {
          association: "exam",
          attributes: ["id", "name", "date"],
        }],
    });

    new SuccessResponse("Exam results fetched", results).sendResponse(res);
  }
);
export const getAttendanceBySession = asyncHandler(
  async (req: Request, res: Response) => {
  const { session, term } = await getActiveAcademicPeriod();

    if (!session || !term) {
      res.status(400).json({ message: "No active academic period found" });
      return;
    }
    const attendance = await Attendance.findAll({
      where: { sessionId: session.id },
      include: [
        {
          association: "student",
          attributes: ["id", "firstName", "lastName", "gender", "email"],
        },
        {
          association: "class",
          attributes: ["id", "name", "sessionId", "teacherId"],
        },
      ],
    });

    new SuccessResponse("Attendance fetched", attendance).sendResponse(res);
  }
);
export const getAssignmentsBySession = asyncHandler(
  async (req: Request, res: Response) => {
    const { session, term } = await getActiveAcademicPeriod();

    if (!session || !term) {
      res.status(400).json({ message: "No active academic period found" });
      return;
    }

    const assignments = await Assignment.findAll({
      where: { sessionId: session.id },
      include: ["subject", "class"],
    });

    new SuccessResponse("Assignments fetched", assignments).sendResponse(res);
  }
);

export const getTestScoresBySession = asyncHandler(
  async (req: Request, res: Response) => {
  const { session, term } = await getActiveAcademicPeriod();

    if (!session || !term) {
      res.status(400).json({ message: "No active academic period found" });
      return;
    }
    const scores = await ClassTest.findAll({
      where: { sessionId: session.id },
      include: [{
          association: "student",
          attributes: ["id", "firstName", "lastName", "gender", "email"],
        }, "subject", "class"],
    });

    new SuccessResponse("Test scores fetched", scores).sendResponse(res);
  }
);
export const getReportCardsBySession = asyncHandler(
  async (req: Request, res: Response) => {
  const { session, term } = await getActiveAcademicPeriod();

    if (!session || !term) {
      res.status(400).json({ message: "No active academic period found" });
      return;
    }
    const reportCards = await ReportCard.findAll({
      where: { sessionId: session.id },
      include: [
        {
          association: "student",
          attributes: ["id", "firstName", "lastName", "gender", "email"],
        },
        {
          association: "class",
          attributes: ["id", "name", "sessionId", "teacherId"],
        },
        {
          association: "subject",
          attributes: ["id", "name"],
        },
      ],
      order: [
        ["studentId", "ASC"],
        ["termId", "ASC"],
      ],
    });

    new SuccessResponse("Report cards fetched", reportCards).sendResponse(res);
  }
);
export const getTimetableBySession = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
  const { session, term } = await getActiveAcademicPeriod();

    if (!session || !term) {
      res.status(400).json({ message: "No active academic period found" });
      return;
    }
    const timetables = await Timetable.findAll({
      where: { sessionId: session.id },
      order: [
        ["classId", "ASC"],
        ["day", "ASC"],
        ["period", "ASC"],
      ],
    });

    new SuccessResponse("Timetable fetched", timetables).sendResponse(res);
  }
);

