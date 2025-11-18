import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import SuccessResponse, { getActiveSession } from "../../middlewares/helper";
import Exam from "../../models/Exams/exam.model";
import ExamResult from "../../models/Exams/examResults.model";
import { Student, Subject } from "../../models/association.model";
import Session from "../../models/session/session.model";

// ✅ Create New Exam (Admin)
export const createExam = asyncHandler(async (req: Request, res: Response) => {
    const { name, classId, subjectId, term, date } = req.body;

    // Verify subject belongs to class
    const subject = await Subject.findOne({
        where: { id: subjectId, classId },
    });

    if (!subject) {
        res.status(404).json({
            success: false,
            message: "This subject does not belong to the specified class.",
        });
        return;
    }

    // Check if exam already exists for this subject in this class and term
    const existingExam = await Exam.findOne({
        where: { classId, subjectId, term },
    });

    if (existingExam) {
        res.status(400).json({
            success: false,
            message: "An exam has already been created for this subject in this class for this term.",
        });
        return;
    }
        const activeSession = await getActiveSession();

    // Create exam
    const exam = await Exam.create({ name, classId, subjectId, term, date, sessionId:activeSession?.id});

    new SuccessResponse("Exam created successfully", exam).sendResponse(res);
});


// ✅ Get All Exams
export const getAllExams = asyncHandler(async (req: Request, res: Response) => {
  // 🔹 Get active session
  const activeSession = await Session.findOne({ where: { isActive: true } });

  if (!activeSession) {
    res.status(400).json({ message: "No active session found" });
    return;
  }

  // 🔹 Fetch exams for ONLY this session
  const exams = await Exam.findAll({
    where: { sessionId: activeSession.id },
    include: ["class", "subject"],
  });

  if (exams.length === 0) {
    res.status(404).json({ message: "No exams found for this session" });
    return;
  }

  new SuccessResponse(
    "Exams for the active session retrieved successfully",
    exams
  ).sendResponse(res);
});


// ✅ Get Exam Details
export const getExamDetails = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const exam = await Exam.findByPk(id, { include: ["class", "subject"] });
    if (!exam) {
        res.status(404).json({ message: "Exam not found" });
        return;
    }

    new SuccessResponse("Exam details retrieved successfully", exam).sendResponse(res);
});

// ✅ Upload Exam Results (Teacher)
export const uploadExamResults = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { results } = req.body;

  const exam = await Exam.findByPk(id);
  if (!exam) {
    throw new Error("Exam not found");
  }

  // 🔹 Get active session ONCE
  const activeSession = await getActiveSession();
  if (!activeSession) {
    throw new Error("No active session found");
  }

  const createdResults = await Promise.all(
    results.map(async (result: { studentId: number; marksObtained: number; subjectId: number; term: string }) => {

      if (result.marksObtained < 0 || result.marksObtained > 60) {
        throw new Error(`Invalid mark for Student ID ${result.studentId}. Marks must be between 0 and 60.`);
      }

      const existing = await ExamResult.findOne({
        where: {
          examId: exam.id,
          studentId: result.studentId,
          subjectId: result.subjectId,
          term: result.term,
        },
      });

      if (existing) {
        throw new Error(
          `Result already uploaded for Student ID ${result.studentId} in this subject and term.`
        );
      }

      return ExamResult.create({
        examId: exam.id,
        subjectId: result.subjectId,
        studentId: result.studentId,
        term: result.term,
        marksObtained: result.marksObtained,
        sessionId: activeSession.id, // ← Correct session placement
      });
    })
  );

  new SuccessResponse("Exam results uploaded successfully", createdResults).sendResponse(res);
});


// ✅ Get Exam Results
export const getExamResults = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const results = await ExamResult.findAll({
        where: { examId: id },
        include: [
            {
                model: Student,
                as: "student",
                attributes: ["firstName", "lastName"]
            }
        ],
    });

    new SuccessResponse("Exam results retrieved successfully", results).sendResponse(res);
});

// ✅ Update Exam Result
export const updateExamResult = asyncHandler(async (req: Request, res: Response) => {
    const { id, resultId } = req.params;
    const { marksObtained } = req.body;

    const result = await ExamResult.findOne({ where: { id: resultId, examId: id } });
    if (!result) {
        res.status(404).json({ message: "Result not found" });
        return;
    }

    result.marksObtained = marksObtained;
    await result.save();

    new SuccessResponse("Exam result updated successfully", result).sendResponse(res);
});
