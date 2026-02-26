import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import SuccessResponse, { getActiveAcademicPeriod, getActiveSession } from "../../middlewares/helper";
import Exam from "../../models/Exams/exam.model";
import ExamResult from "../../models/Exams/examResults.model";
import { ClassModel, Student, Subject } from "../../models/association.model";
import Session from "../../models/session/session.model";
import { log } from "console";

// ✅ Create New Exam (Admin)
export const createExam = asyncHandler(async (req: Request, res: Response) => {
  const { name, classId, subjectId, date } = req.body;
  const { session, term } = await getActiveAcademicPeriod();
  if (!session || !term) {
    res.status(400).json({ message: "No active academic period found" });
    return;
  }
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
    where: { classId, subjectId, sessionId: session.id, termId: term.id },
  });

  if (existingExam) {
    res.status(400).json({
      success: false,
      message: "An exam has already been created for this subject in this class for this term.",
    });
    return;
  }

  // Create exam
  const exam = await Exam.create({ name, classId, subjectId, date, termId: term.id, sessionId: session.id });

  new SuccessResponse("Exam created successfully", exam).sendResponse(res);
});
// ✅ Get All Exams
export const getAllExams = asyncHandler(async (req: Request, res: Response) => {
  // 🔹 Get active session
  const { session, term } = await getActiveAcademicPeriod();
  if (!session || !term) {
    res.status(400).json({ message: "No active academic period found" });
    return;
  }
  // 🔹 Fetch exams for ONLY this session
  const exams = await Exam.findAll({
    where: { sessionId: session.id, termId: term.id },
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
  const { session, term } = await getActiveAcademicPeriod();
  if (!session || !term) {
    res.status(400).json({ message: "No active academic period found" });
    return;
  }
  const exam = await Exam.findOne({
    where: { id, sessionId: session.id, termId: term.id },
    include: ["class", "subject"]
  });
  if (!exam) {
    res.status(404).json({ message: "Exam not found" });
    return;
  }

  new SuccessResponse("Exam details retrieved successfully", exam).sendResponse(res);
});
// ✅ Upload Exam Results (Teacher)
export const uploadExamResults = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { results } = req.body;
    const { session, term } = await getActiveAcademicPeriod();
    if (!session || !term) {
      res.status(400).json({ message: "No active academic period found" });
      return;
    }
    if (!Array.isArray(results) || results.length === 0) {
      res.status(400).json({ message: "Results array is required" });
      return;
    }

    const exam = await Exam.findOne({
      where: { id, sessionId: session.id, termId: term.id }
    });
    if (!exam) {
      res.status(404).json({ message: "Exam not found" });
      return;
    }

    const createdResults = [];

    for (const result of results) {
      const { studentId, subjectId, marksObtained } = result;

      if (marksObtained < 0 || marksObtained > 60) {
        throw new Error(
          `Invalid marks for student ${studentId}. Must be 0–60`
        );
      }

      const student = await Student.findByPk(studentId);
      if (!student) {
        throw new Error(`Student ${studentId} not found`);
      }

      const subject = await Subject.findByPk(subjectId);
      if (!subject) {
        throw new Error(`Subject ${subjectId} not found`);
      }

      const existing = await ExamResult.findOne({
        where: {
          examId: exam.id,
          studentId,
          subjectId,
          termId: term.id,
          sessionId: session.id,
        },
      });

      if (existing) {
        throw new Error(
          `Result already exists for student ${studentId} (${term.name} ${session.name})`
        );
      }

      const examResult = await ExamResult.create({
        examId: exam.id,
        studentId,
        subjectId,
        termId: term.id,
        marksObtained,
        sessionId: session.id,
      });

      createdResults.push(examResult);
    }

    new SuccessResponse(
      "Exam results uploaded successfully",
      createdResults
    ).sendResponse(res);
  }
);
// ✅ Get Exam Results
export const getExamResults = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { session, term } = await getActiveAcademicPeriod();
  if (!session || !term) {
    res.status(400).json({ message: "No active academic period found" });
    return;
  }
  const results = await ExamResult.findAll({
    where: { examId: id, sessionId: session.id, termId: term.id },
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
  const { session, term } = await getActiveAcademicPeriod();
  if (!session || !term) {
    res.status(400).json({ message: "No active academic period found" });
    return;
  }
  const result = await ExamResult.findOne({
    where: {
      id: resultId,
      examId: id,
      sessionId: session.id,
      termId: term.id
    }
  });
  if (!result) {
    res.status(404).json({ message: "Result not found" });
    return;
  }

  result.marksObtained = marksObtained;
  await result.save();

  new SuccessResponse("Exam result updated successfully", result).sendResponse(res);
});
export const getExamsWithPendingScores = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { classId } = req.params;
    const { session, term } = await getActiveAcademicPeriod();
    if (!session || !term) {
      res.status(400).json({ message: "No active academic period found" });
      return;
    }
    // 1️⃣ Get all students in this class
    const students = await Student.findAll({
      where: { classId },
      attributes: ["id"],
    });

    const totalStudents = students.length;

    if (totalStudents === 0) {
      res.status(404).json({ message: "No students found in this class" });
      return;
    }

    // 2️⃣ Get all exams for this class/session/term
    const exams = await Exam.findAll({
      where: {
        classId,
        sessionId: session.id,
        termId: term.id,
      },
      include: [
        {
          model: Subject,
          as: "subject",
          attributes: ["id", "name"],
        },
        {
          model: ClassModel,
          as: "class",
          attributes: ["id", "name"],
        },
      ],
    });

    const pendingExams: any[] = [];

    // 3️⃣ Check each exam
    for (const exam of exams) {
      const resultsCount = await ExamResult.count({
        where: {
          examId: exam.id,
          sessionId: session.id,
          termId: term.id,
        },
      });
      const status = resultsCount === totalStudents ? "submitted" : "draft";

      // 4️⃣ If not all students have results → still pending
      if (resultsCount < totalStudents) {
        pendingExams.push({
          exam,
          totalStudents,
          resultsUploaded: resultsCount,
          remaining: totalStudents - resultsCount,
          exam_status: status, // ✅ added

        });
      }
    }

    new SuccessResponse(
      "Exams with pending score uploads fetched",
      pendingExams
    ).sendResponse(res);
  }
);
export const getCompletedExams = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { classId } = req.params;
    const { session, term } = await getActiveAcademicPeriod();
    if (!session || !term) {
      res.status(400).json({ message: "No active academic period found" });
      return;
    }
    // 1️⃣ Get all students in this class
    const students = await Student.findAll({
      where: { classId },
      attributes: ["id"],
    });

    const totalStudents = students.length;

    if (totalStudents === 0) {
      res.status(404).json({ message: "No students found in this class" });
      return;
    }

    // 2️⃣ Get all exams for this class/session/term
    const exams = await Exam.findAll({
      where: {
        classId,
        sessionId: session.id,
        termId: term.id,
      },
      include: [
        {
          model: Subject,
          as: "subject",
          attributes: ["id", "name"],
        },
        {
          model: ClassModel,
          as: "class",
          attributes: ["id", "name"],
        },
      ],
    });

    const completedExams: any[] = [];

    // 3️⃣ Check each exam
    for (const exam of exams) {
      const resultsCount = await ExamResult.count({
        where: {
          examId: exam.id,
          sessionId: session.id,
          termId: term.id,
        },
      });

      // 4️⃣ If all students have results → completed
      if (resultsCount === totalStudents) {
        completedExams.push({
          exam,
          totalStudents,
          resultsUploaded: resultsCount,
        });
      }
    }

    new SuccessResponse(
      "Exams with fully uploaded scores fetched",
      completedExams
    ).sendResponse(res);
  }
);
