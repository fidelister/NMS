import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import SuccessResponse, { getActiveSession, getGrade } from "../../middlewares/helper";
import ExamResult from "../../models/Exams/examResults.model";
import { ClassModel, Student, Subject } from "../../models/association.model";
import ClassTest from "../../models/ClassTests/classTests.model";
import ReportCard from "../../models/report_card/report_card.model";
import Session from "../../models/session/session.model";


// ✅ POST /api/report-cards/generate
// export const generateReportCards = asyncHandler(async (req: Request, res: Response) => {
//   const { classId, term } = req.body;

//   const students = await Student.findAll({ where: { classId } });
//   const subjects = await Subject.findAll({ where: { classId } });

//   const reportCards: any[] = [];

//   for (const student of students) {
//     for (const subject of subjects) {
//       const classTest = await ClassTest.findOne({
//         where: { studentId: student.id, subjectId: subject.id, term },
//       });

//       const examResult = await ExamResult.findOne({
//         where: { studentId: student.id, subjectId: subject.id, term },
//       });

//       const testScore = classTest?.totalMarkObtained ?? 0;
//       const examScore = examResult?.marksObtained ?? 0;
//       const totalScore = testScore + examScore;
//       const { grade, remark } = getGrade(totalScore);

//       const reportCard = await ReportCard.create({
//         studentId: student.id,
//         classId,
//         subjectId: subject.id,
//         term,
//         testScore,
//         examScore,
//         totalScore,
//         grade,
//         remark,
//       });

//       reportCards.push(reportCard);
//     }
//   }

//   new SuccessResponse("Report cards generated successfully", reportCards).sendResponse(res);
// });
export const generateReportCards = asyncHandler(async (req: Request, res: Response) => {
  const { classId, term } = req.body;

  // ✅ Get active session
  const activeSession = await Session.findOne({ where: { isActive: true } });
  if (!activeSession) {
    res.status(400).json({ message: "No active session found" });
    return;
  }

  // ✅ Check if report cards already generated for this class + term + session
  const existing = await ReportCard.findOne({
    where: { classId, term, sessionId: activeSession.id },
  });

  if (existing) {
    res.status(400).json({
      message: "Report cards have already been generated for this class, term, and session.",
    });
    return;
  }

  // ✅ Get students and subjects *only for this session*
  const students = await Student.findAll({
    where: { classId, sessionId: activeSession.id },
  });

  const subjects = await Subject.findAll({
    where: { classId, sessionId: activeSession.id },
  });

  const reportCards: any[] = [];

  // LOOP STUDENTS ➝ LOOP SUBJECTS
  for (const student of students) {
    for (const subject of subjects) {
      // 🔹 Class Test
      const classTest = await ClassTest.findOne({
        where: {
          studentId: student.id,
          subjectId: subject.id,
          term,
          sessionId: activeSession.id,
        },
      });

      // 🔹 Exam Result
      const examResult = await ExamResult.findOne({
        where: {
          studentId: student.id,
          subjectId: subject.id,
          term,
          sessionId: activeSession.id,
        },
      });

      const testScore = classTest?.totalMarkObtained ?? null;
      const examScore = examResult?.marksObtained ?? null;

      // ❌ Skip if the student has NO score at all
      if (testScore === null && examScore === null) continue;

      const totalScore = (testScore ?? 0) + (examScore ?? 0);
      const { grade, remark } = getGrade(totalScore);

      // 🔹 Create Report Card
      const reportCard = await ReportCard.create({
        studentId: student.id,
        classId,
        subjectId: subject.id,
        term,
        testScore: testScore ?? 0,
        examScore: examScore ?? 0,
        totalScore,
        grade,
        remark,
        sessionId: activeSession.id,
      });

      reportCards.push(reportCard);
    }
  }

  if (reportCards.length === 0) {
    res.status(404).json({
      message:
        "No report cards generated — no student has valid test/exam results for this term in the active session.",
    });
    return;
  }

  // FINAL RESPONSE
  new SuccessResponse("Report cards generated successfully", {
    count: reportCards.length,
    sessionId: activeSession.id,
    term,
    classId,
    reportCards,
  }).sendResponse(res);
});


// // ✅ GET /api/report-cards/class/:classId
export const getClassReportCards = asyncHandler(async (req: Request, res: Response) => {
  const { classId } = req.params;

  const reportCards = await ReportCard.findAll({
    where: { classId },
    include: [
      { model: Student, as: "student", attributes: ["firstName", "lastName"] },
      { model: Subject, as: "subject", attributes: ["name"] },
    ],
  });

  new SuccessResponse("Class report cards retrieved successfully", reportCards).sendResponse(res);
});

// // ✅ GET /api/report-cards/student/:studentId
export const getStudentReportCard = asyncHandler(async (req: Request, res: Response) => {
  const { studentId } = req.params;
  const { term } = req.body;

  // Fetch student's report cards for the term
  const reportCards = await ReportCard.findAll({
    where: { studentId, term },
    include: [
      { model: ClassModel, as: "class", attributes: ["id", "name"] },
      { model: Subject, as: "subject", attributes: ["name"] },
    ],
  });

  if (reportCards.length === 0) {
    res.status(404).json({ message: "No report card found for this student and term." });
  }

  const classId = reportCards[0].classId; // Get classId from report card

  // ✅ Step 1: Fetch all report cards in that class & term
  const allClassReportCards = await ReportCard.findAll({
    where: { classId, term },
    include: [{ model: Student, as: "student", attributes: ["id"] }]
  });

  // ✅ Step 2: Compute each student's total & average
  const studentAverages: Record<number, number> = {};

  for (const rc of allClassReportCards) {
    if (!studentAverages[rc.studentId]) studentAverages[rc.studentId] = 0;
    studentAverages[rc.studentId] += rc.totalScore;
  }

  // Get subject count per student (all students in same class have same subject count, but we compute precise)
  const subjectCount: Record<number, number> = {};
  for (const rc of allClassReportCards) {
    if (!subjectCount[rc.studentId]) subjectCount[rc.studentId] = 0;
    subjectCount[rc.studentId] += 1;
  }

  const averagesArray = Object.entries(studentAverages).map(([sId, total]) => ({
    studentId: Number(sId),
    average: parseFloat((total / subjectCount[Number(sId)]).toFixed(2)),
  }));

  // ✅ Step 3: Sort by highest average
  averagesArray.sort((a, b) => b.average - a.average);

  // ✅ Step 4: Assign ranking
  const ranking: Record<number, number> = {};
  averagesArray.forEach((item, index) => {
    ranking[item.studentId] = index + 1;
  });

  // ✅ Compute this student’s average and position
  const totalSubjects = reportCards.length;
  const totalScore = reportCards.reduce((sum, rc) => sum + rc.totalScore, 0);
  const average = parseFloat((totalScore / totalSubjects).toFixed(2));
  const position = ranking[Number(studentId)];

  const overall = {
    totalSubjects,
    totalScore,
    average,
    position
  };

  new SuccessResponse("Student report card retrieved successfully", {
    overall,
    eachSubjects: reportCards,
  }).sendResponse(res);
});


export const regenerateReportCards = asyncHandler(async (req: Request, res: Response) => {
  const { classId, term } = req.body;

  // 🔍 Get the active session
  const activeSession = await Session.findOne({ where: { isActive: true } });
  if (!activeSession) {
    res.status(400).json({ message: "No active session found" });
    return;
  }

  // 🔍 Delete old report cards for this class + term + session
  await ReportCard.destroy({
    where: {
      classId,
      term,
      sessionId: activeSession.id
    },
  });

  // 🔍 Get required students & subjects under this session
  const students = await Student.findAll({
    where: { classId, sessionId: activeSession.id },
  });

  const subjects = await Subject.findAll({
    where: { classId, sessionId: activeSession.id },
  });

  const reportCards: any[] = [];

  // 🔄 Regenerate fresh report cards
  for (const student of students) {
    for (const subject of subjects) {
      const classTest = await ClassTest.findOne({
        where: {
          studentId: student.id,
          subjectId: subject.id,
          term,
          sessionId: activeSession.id,
        },
      });

      const examResult = await ExamResult.findOne({
        where: {
          studentId: student.id,
          subjectId: subject.id,
          term,
          sessionId: activeSession.id,
        },
      });

      const testScore = classTest?.totalMarkObtained ?? null;
      const examScore = examResult?.marksObtained ?? null;

      // Skip if no valid data
      if (testScore === null && examScore === null) continue;

      const totalScore = (testScore ?? 0) + (examScore ?? 0);
      const { grade, remark } = getGrade(totalScore);

      // Create new report card
      const report = await ReportCard.create({
        studentId: student.id,
        classId,
        subjectId: subject.id,
        term,
        testScore: testScore ?? 0,
        examScore: examScore ?? 0,
        totalScore,
        grade,
        remark,
        sessionId: activeSession.id,
      });

      reportCards.push(report);
    }
  }

  if (reportCards.length === 0) {
    res.status(404).json({
      message:
        "No report cards regenerated — no student has valid test/exam scores for this term in the active session.",
    });
    return;
  }

  new SuccessResponse("Report cards regenerated successfully", {
    classId,
    term,
    sessionId: activeSession.id,
    count: reportCards.length,
    reportCards,
  }).sendResponse(res);
});
