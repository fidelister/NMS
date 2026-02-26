import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import SuccessResponse, { getActiveAcademicPeriod, getActiveSession, getGrade } from "../../middlewares/helper";
import ExamResult from "../../models/Exams/examResults.model";
import { ClassModel, Student, Subject } from "../../models/association.model";
import ClassTest from "../../models/ClassTests/classTests.model";
import ReportCard from "../../models/report_card/report_card.model";
import Session from "../../models/session/session.model";
import { AuthRequest } from "../../middlewares/authMiddleware";


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
  const { classId } = req.body;
  // Get active session
    const { session, term } = await getActiveAcademicPeriod();
     if (!session || !term) {
       res.status(400).json({ message: "No active academic period found" });
       return;
     }
  // Prevent duplicate generation
  // const existing = await ReportCard.findOne({
  //   where: { classId, term, sessionId: activeSession.id },
  // });

  // if (existing) {
  //   res.status(400).json({
  //     message:
  //       "Report cards have already been generated for this class, term, and session.",
  //   });
  //   return;
  // }

  // Get students + subjects
  const students = await Student.findAll({
    where: { classId, sessionId: session.id },
  });

  const subjects = await Subject.findAll({
    where: { classId, sessionId: session.id },
  });

  const generatedCards: any[] = [];

  // Create ReportCards
  for (const student of students) {
    for (const subject of subjects) {
      const classTest = await ClassTest.findOne({
        where: {
          studentId: student.id,
          subjectId: subject.id,
          termId: term.id,
          sessionId: session.id,
        },
      });

      const examResult = await ExamResult.findOne({
        where: {
          studentId: student.id,
          subjectId: subject.id,
          termId: term.id,
          sessionId: session.id,
        },
      });

      const testScoresArray = [
        classTest?.test1 ?? 0,
        classTest?.test2 ?? 0,
      
      ];

      const testScore = classTest?.totalMarkObtained ?? 0;
      const examScore = examResult?.marksObtained ?? 0;

      // Skip empty results
      if (!testScore && !examScore) continue;

      const totalScore = testScore + examScore;
      const { grade, remark } = getGrade(totalScore);

      const reportCard = await ReportCard.create({
        studentId: student.id,
        classId,
        subjectId: subject.id,
        testScore,
        examScore,
        totalScore,
        grade,
        remark,
        sessionId: session.id,
        termId: term.id,
      });

      generatedCards.push({
        studentId: student.id,
        studentName: student?.firstName + " " + student?.lastName,
        nmsNumber: student.nmsNumber, 
        subjectId: subject.id,
        subjectName: subject.name,
        assessments: testScoresArray,
        testScore,
        examScore,
        totalScore,
        grade,
        remark,
      });
    }
  }

  if (generatedCards.length === 0) {
    res.status(404).json({
      message:
        "No report cards generated — no valid results for this term in the active session.",
    });
    return;
  }

  // GROUP BY STUDENTS
  const studentResultMap: any = {};

  generatedCards.forEach((r) => {
    if (!studentResultMap[r.studentId]) {
      studentResultMap[r.studentId] = {
        student_id: r.studentId,
        nmsNumber: r.nmsNumber,
        student_name: r.studentName,
        overall_average: 0,
        position: "", // <-- FIXED: Add position before sorting
        subjects: [],
      };
    }

    studentResultMap[r.studentId].subjects.push({
      subject_name: r.subjectName,
      assessments: r.assessments,
      testScore: r.testScore,
      examScore: r.examScore,
      total_score: r.totalScore,
      grade: r.grade,
      remark: r.remark,
    });
  });

  // Compute average per student
  const finalResult = Object.values(studentResultMap).map((s: any) => {
    const total = s.subjects.reduce((a: number, b: any) => a + b.total_score, 0);
    const avg = total / s.subjects.length;
    s.overall_average = Number(avg.toFixed(2));
    return s;
  });

  // Sort by avg DESC & assign position
  finalResult.sort((a: any, b: any) => b.overall_average - a.overall_average);

  finalResult.forEach((s: any, i: number) => {
    s.position =
      i === 0 ? "1st" : i === 1 ? "2nd" : i === 2 ? "3rd" : `${i + 1}th`;
  });

  // Compute class average
  const classAverage =
    finalResult.reduce((sum: number, s: any) => sum + s.overall_average, 0) /
    finalResult.length;

  // Class info
  const theClass = await ClassModel.findByPk(classId);

  // FINAL RESPONSE
  return new SuccessResponse("Report cards generated successfully", {
    meta: {
      session: session.name,
      term: term.name,
      class: theClass?.name,
      total_students: finalResult.length,
      class_average: Number(classAverage.toFixed(2)),
      data: finalResult,
    },
  }).sendResponse(res);
});




// // ✅ GET /api/report-cards/class/:classId
export const getClassReportCards = asyncHandler(async (req: Request, res: Response) => {
  const { classId } = req.params;
 const { session, term } = await getActiveAcademicPeriod();
     if (!session || !term) {
       res.status(400).json({ message: "No active academic period found" });
       return;
     }
  const reportCards = await ReportCard.findAll({
    where: { classId, sessionId: session.id, termId: term.id },
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
 const { session, term } = await getActiveAcademicPeriod();
     if (!session || !term) {
       res.status(400).json({ message: "No active academic period found" });
       return;
     }
  // Fetch student's report cards for the term
  const reportCards = await ReportCard.findAll({
    where: { studentId, sessionId: session.id, termId: term.id },
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
    where: { classId, termId: term.id, sessionId: session.id },
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
export const getStudentCard = asyncHandler(async (req: AuthRequest, res: Response) => {
  const studentId  = req.user?.id;
 const { session, term } = await getActiveAcademicPeriod();
     if (!session || !term) {
       res.status(400).json({ message: "No active academic period found" });
       return;
     }
  // Fetch student's report cards for the term
  const reportCards = await ReportCard.findAll({
    where: { studentId, sessionId: session.id, termId: term.id },
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
    where: { classId, termId: term.id, sessionId: session.id },
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
  const { classId } = req.body;
 const { session, term } = await getActiveAcademicPeriod();
     if (!session || !term) {
       res.status(400).json({ message: "No active academic period found" });
       return;
     }


  // 🔍 Delete old report cards for this class + term + session
  await ReportCard.destroy({
    where: {
      classId,
      termId: term.id,
      sessionId: session.id
    },
  });

  // 🔍 Get required students & subjects under this session
  const students = await Student.findAll({
    where: { classId, sessionId: session.id },
  });

  const subjects = await Subject.findAll({
    where: { classId, sessionId: session.id },
  });

  const reportCards: any[] = [];

  // 🔄 Regenerate fresh report cards
  for (const student of students) {
    for (const subject of subjects) {
      const classTest = await ClassTest.findOne({
        where: {
          studentId: student.id,
          subjectId: subject.id,
          termId: term.id,
          sessionId: session.id,
        },
      });

      const examResult = await ExamResult.findOne({
        where: {
          studentId: student.id,
          subjectId: subject.id,
          termId: term.id,
          sessionId: session.id,
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
        testScore: testScore ?? 0,
        examScore: examScore ?? 0,
        totalScore,
        grade,
        remark,
        sessionId: session.id,
        termId: term.id,
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
    term: term.name,
    session: session.name,
    count: reportCards.length,
    reportCards,
  }).sendResponse(res);
});

// GET /api/v1/results/class/:classId?term=Term 1
// export const getClassResults = asyncHandler(async (req: Request, res: Response) => {
//   const { classId, term } = req.body;

//   if (!term) {
//     res.status(400).json({ message: "Term is required (term1, term2, term3)" });
//     return;
//   }

//   // 🔹 Get active session
//   const activeSession = await Session.findOne({ where: { isActive: true } });
//   if (!activeSession) {
//     res.status(400).json({ message: "No active session found" });
//     return;
//   }

//   // 🔹 Get the class
//   const classRecord = await ClassModel.findByPk(classId);
//   if (!classRecord) {
//     res.status(404).json({ message: "Class not found" });
//     return;
//   }

//   // 🔹 Get students in this class + session
//   const students = await Student.findAll({
//     where: { classId, sessionId: activeSession.id },
//   });

//   if (students.length === 0) {
//     res.status(404).json({ message: "No students found in this class for this session" });
//     return;
//   }

//   // 🔹 Fetch all report cards for this class + term + session
//   const reportCards = await ReportCard.findAll({
//     where: {
//       classId,
//       term,
//       sessionId: activeSession.id,
//     },
//     include: [
//       { model: Subject, as: "subject", attributes: ["id", "name"] },
//     ],
//     order: [["studentId", "ASC"]],
//   });

//   // 🔹 Group results by student
//   const resultsMap: any = {};

//   for (const rc of reportCards) {
//     if (!resultsMap[rc.studentId]) {
//       const student = students.find((s) => s.id === rc.studentId);

//       resultsMap[rc.studentId] = {
//         studentId: student?.id,
//         name: student?.firstName + " " + student?.lastName,
//         subjects: [],
//         total_score_sum: 0,
//         subject_count: 0,
//       };
//     }

//     resultsMap[rc.studentId].subjects.push({
//       subject: rc.subject?.name,
//       testScore: rc.testScore,
//       examScore: rc.examScore,
//       grand_total: rc.totalScore,
//       grade: rc.grade,
//     });

//     resultsMap[rc.studentId].total_score_sum += rc.totalScore;
//     resultsMap[rc.studentId].subject_count += 1;
//   }

//   // 🔹 Convert to response format
//   const finalData = Object.values(resultsMap).map((item: any) => ({
//     studentId: item.studentId,
//     firstName: item.firstName,
//     subjects: item.subjects,
//     cumulative_average: Number((item.total_score_sum / item.subject_count).toFixed(2)),
//   }));

//   // ============================
//   // FINAL RESPONSE
//   // ============================
//   res.status(200).json({
//     status: "success",
//     meta: {
//       class: classRecord.name,
//       session: activeSession.name,
//       term,
//       student_count: finalData.length,
//     },
//     data: finalData,
//   });
// });
// export const getClassResults = asyncHandler(async (req: Request, res: Response) => {
//   const { classId, term } = req.params;

//   if (!term) {
//     res.status(400).json({ message: "Term is required (term1, term2)" });
//     return;
//   }

//   // 🔹 Get active session
//   const activeSession = await Session.findOne({ where: { isActive: true } });
//   if (!activeSession) {
//     res.status(400).json({ message: "No active session found" });
//     return;
//   }

//   // 🔹 Get the class
//   const classRecord = await ClassModel.findByPk(classId);
//   if (!classRecord) {
//     res.status(404).json({ message: "Class not found" });
//     return;
//   }

//   // 🔹 Get students in this class + session
//   const students = await Student.findAll({
//     where: { classId, sessionId: activeSession.id },
//   });

//   if (students.length === 0) {
//     res.status(404).json({ message: "No students found in this class for this session" });
//     return;
//   }

//   // 🔹 Fetch all report cards
//   const reportCards = await ReportCard.findAll({
//     where: {
//       classId,
//       term,
//       sessionId: activeSession.id,
//     },
//     include: [
//       { model: Subject, as: "subject", attributes: ["id", "name"] },
//     ],
//   });

//   // ================================
//   // 🔹 CALCULATE SUBJECT POSITIONS
//   // ================================
//   const subjectGroups: any = {};

//   // Group by subject
//   for (const rc of reportCards) {
//     const subjectId = rc.subjectId;

//     if (!subjectGroups[subjectId]) {
//       subjectGroups[subjectId] = [];
//     }

//     subjectGroups[subjectId].push(rc);
//   }

//   // Map: studentId + subjectId → position
//   const subjectPositionMap: any = {};

//   Object.keys(subjectGroups).forEach((subjectId) => {
//     const sorted = subjectGroups[subjectId].sort(
//       (a: any, b: any) => b.totalScore - a.totalScore
//     );

//     sorted.forEach((rc: any, index: number) => {
//       const key = `${rc.studentId}_${subjectId}`;
//       subjectPositionMap[key] = index + 1;
//     });
//   });

//   // ================================
//   // 🔹 GROUP RESULTS BY STUDENT
//   // ================================
//   const resultsMap: any = {};

//   for (const rc of reportCards) {
//     if (!resultsMap[rc.studentId]) {
//       const student = students.find((s) => s.id === rc.studentId);

//       resultsMap[rc.studentId] = {
//         studentId: student?.id,
//         name: student?.firstName + " " + student?.lastName,
//         nmsNumber: student?.nmsNumber,
//         subjects: [],
//         total_score_sum: 0,
//         subject_count: 0,
//       };
//     }

//     const key = `${rc.studentId}_${rc.subjectId}`;
//     const position = subjectPositionMap[key];

//     resultsMap[rc.studentId].subjects.push({
//       subject: rc.subject?.name,
//       testScore: rc.testScore,
//       examScore: rc.examScore,
//       grand_total: rc.totalScore,
//       grade: rc.grade,
//       position, // ✅ subject position added
//     });

//     resultsMap[rc.studentId].total_score_sum += rc.totalScore;
//     resultsMap[rc.studentId].subject_count += 1;
//   }

//   // ================================
//   // 🔹 FINAL FORMAT
//   // ================================
//   const finalData = Object.values(resultsMap).map((item: any) => ({
//     studentId: item.studentId,
//     name: item.name,
//     nmsNumber: item.nmsNumber,
//     subjects: item.subjects,
//     cumulative_average: Number(
//       (item.total_score_sum / item.subject_count).toFixed(2)
//     ),
//   }));

//   res.status(200).json({
//     status: "success",
//     meta: {
//       class: classRecord.name,
//       session: activeSession.name,
//       term,
//       student_count: finalData.length,
//     },
//     data: finalData,
//   });
// });

export const getClassResults = asyncHandler(async (req: Request, res: Response) => {
  const { classId } = req.params;


  // 🔹 Get active session
        
  const { session, term } = await getActiveAcademicPeriod();
     if (!session || !term) {
       res.status(400).json({ message: "No active academic period found" });
       return;
     }

  // 🔹 Get the class
  const classRecord = await ClassModel.findByPk(classId);
  if (!classRecord) {
    res.status(404).json({ message: "Class not found" });
    return;
  }

  // 🔹 Get students in this class + session
  const students = await Student.findAll({
    where: { classId, sessionId: session.id },
  });

  if (students.length === 0) {
    res.status(404).json({
      message: "No students found in this class for this session",
    });
    return;
  }

  // 🔹 Fetch all report cards
  const reportCards = await ReportCard.findAll({
    where: {
      classId,
      termId: term.id,
      sessionId: session.id,
    },
    include: [
      { model: Subject, as: "subject", attributes: ["id", "name"] },
    ],
  });

  if (reportCards.length === 0) {
    res.status(404).json({ message: "No results found for this term" });
    return;
  }

  // ==================================================
  // 🔥 CALCULATE SUBJECT POSITIONS (CORRECT VERSION)
  // ==================================================
  const subjectGroups: any = {};

  // Ensure ONE record per student per subject
  for (const rc of reportCards) {
    const subjectId = rc.subjectId;
    const key = `${rc.studentId}_${subjectId}`;

    if (!subjectGroups[subjectId]) {
      subjectGroups[subjectId] = {};
    }

    // overwrite duplicates safely (keeps latest)
    subjectGroups[subjectId][key] = rc;
  }

  // Map for storing calculated positions
  const subjectPositionMap: any = {};

  Object.keys(subjectGroups).forEach((subjectId) => {
    const subjectResults = Object.values(subjectGroups[subjectId]);

    // Sort students by totalScore DESC
    const sorted = subjectResults.sort(
      (a: any, b: any) => b.totalScore - a.totalScore
    );

    sorted.forEach((rc: any, index: number) => {
      const key = `${rc.studentId}_${subjectId}`;
      subjectPositionMap[key] = index + 1;
    });
  });

  // ==================================================
  // 🔹 GROUP RESULTS BY STUDENT
  // ==================================================
  const resultsMap: any = {};

  for (const rc of reportCards) {
    const student = students.find((s) => s.id === rc.studentId);
    if (!student) continue;

    if (!resultsMap[rc.studentId]) {
      resultsMap[rc.studentId] = {
        studentId: student.id,
        name: `${student.firstName} ${student.lastName}`,
        nmsNumber: student.nmsNumber,
        subjects: {},
        total_score_sum: 0,
        subject_count: 0,
      };
    }

    const subjectKey = `${rc.studentId}_${rc.subjectId}`;

    // Avoid duplicate subject entries
    if (!resultsMap[rc.studentId].subjects[rc.subjectId]) {
      resultsMap[rc.studentId].subjects[rc.subjectId] = {
        subject: rc.subject?.name,
        testScore: rc.testScore,
        examScore: rc.examScore,
        grand_total: rc.totalScore,
        grade: rc.grade,
        position: subjectPositionMap[subjectKey],
      };

      resultsMap[rc.studentId].total_score_sum += rc.totalScore;
      resultsMap[rc.studentId].subject_count += 1;
    }
  }

  // ==================================================
  // 🔹 FINAL RESPONSE FORMAT
  // ==================================================
  const finalData = Object.values(resultsMap).map((item: any) => ({
    studentId: item.studentId,
    name: item.name,
    nmsNumber: item.nmsNumber,
    subjects: Object.values(item.subjects),
    cumulative_average: Number(
      (item.total_score_sum / item.subject_count).toFixed(2)
    ),
  }));

  res.status(200).json({
    status: "success",
    meta: {
      class: classRecord.name,
      session: session.name,
      term: term.name,
      student_count: finalData.length,
    },
    data: finalData,
  });
});

