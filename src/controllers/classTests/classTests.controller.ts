import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import SuccessResponse, { getActiveSession } from "../../middlewares/helper";
import { ClassModel, Student, Subject } from "../../models/association.model";
import ClassTest from "../../models/ClassTests/classTests.model";
import { AuthRequest } from "../../middlewares/authMiddleware";

// ✅ Add or Upload Class Test Results
// export const createClassTest = asyncHandler(async (req: AuthRequest, res: Response) => {
//   const { studentId, subjectId, classId, term, date, test1, test2, test3, test4 } = req.body;
//   const loggedTeacherId = req.user?.id; // ✅ get logged-in teacher ID
//   const loggedUserRole = req.user?.role;
//   if (loggedUserRole === "teacher") {
//     const classRecord = await ClassModel.findOne({
//       where: { id: classId, teacherId: loggedTeacherId }
//     });

//     if (!classRecord) {
//       res.status(403).json({
//         success: false,
//         message: "You are not assigned as the primary teacher for this class.",
//       });
//       return;
//     }
//   }
//   // Validate score range (0 to 10)
//   const scores = { test1, test2, test3, test4 };
//   for (const [key, value] of Object.entries(scores)) {
//     if (value !== undefined && (value < 0 || value > 10)) {
//       res.status(400).json({
//         success: false,
//         message: `${key} must be between 0 and 10`,
//       });
//       return;
//     }
//   }

//   // Check if record already exists
//   const existingTest = await ClassTest.findOne({
//     where: { studentId, subjectId, classId, term },
//   });

//   if (existingTest) {
//     res.status(400).json({
//       success: false,
//       message: "Class test has already been uploaded for this student and subject in this term.",
//     });
//     return;
//   }

//   // Calculate totals
//   const totalMarks = 40;
//   const totalMarkObtained =
//     (test1 || 0) + (test2 || 0) + (test3 || 0) + (test4 || 0);

//   // Create new record
//   const activeSession = await getActiveSession();

//   const newRecord = await ClassTest.create({
//     studentId,
//     subjectId,
//     classId,
//     term,
//     date,
//     test1,
//     test2,
//     test3,
//     test4,
//     totalMarks,
//     totalMarkObtained,
//     sessionId: activeSession?.id
//   });

//   new SuccessResponse("Class test record created successfully", newRecord).sendResponse(res);
// });

export const createClassTest = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { classId, subjectId, term, date, results } = req.body;

    const loggedTeacherId = req.user?.id;
    const loggedUserRole = req.user?.role;

    if (!Array.isArray(results) || results.length === 0) {
      res.status(400).json({ message: "Results array is required" });
      return;
    }

    // ✅ Teacher permission check
    if (loggedUserRole === "teacher") {
      const classRecord = await ClassModel.findOne({
        where: { id: classId, teacherId: loggedTeacherId },
      });

      if (!classRecord) {
        res.status(403).json({
          success: false,
          message: "You are not assigned as the primary teacher for this class.",
        });
        return;
      }
    }

    const activeSession = await getActiveSession();
    if (!activeSession) {
      res.status(400).json({ message: "No active session found" });
      return;
    }

    const createdRecords = [];

    for (const result of results) {
      const { studentId, test1, test2 } = result;

      // ✅ Validate term
      if (!["term1", "term2", "term3"].includes(term)) {
        throw new Error(`Invalid term value: ${term}`);
      }

      // ✅ Validate score range
      const scores = { test1, test2 };
      for (const [key, value] of Object.entries(scores)) {
        if (value !== undefined && (value < 0 || value > 10)) {
          throw new Error(`${key} must be between 0 and 10`);
        }
      }

      // ✅ Check student exists
      const student = await Student.findByPk(studentId);
      if (!student) {
        throw new Error(`Student ${studentId} not found`);
      }

      // ✅ Prevent duplicate
      const existingTest = await ClassTest.findOne({
        where: {
          studentId,
          subjectId,
          classId,
          term,
          sessionId: activeSession.id,
        },
      });

      if (existingTest) {
        throw new Error(
          `Test already exists for student ${studentId} (${term})`
        );
      }

      const totalMarks = 40;
      const totalMarkObtained =
        (test1 || 0) + (test2 || 0);

      const newRecord = await ClassTest.create({
        studentId,
        subjectId,
        classId,
        term,
        date,
        test1,
        test2,
        totalMarks,
        totalMarkObtained,
        sessionId: activeSession.id,
      });

      createdRecords.push(newRecord);
    }

    new SuccessResponse(
      "Class test results uploaded successfully",
      createdRecords
    ).sendResponse(res);
  }
);




// ✅ Get All Class Tests for a Class
export const getClassTestsByClass = asyncHandler(async (req: Request, res: Response) => {
  const { classId } = req.params;

  const tests = await ClassTest.findAll({
    where: { classId },
    include: [
      {
        association: "student",
        attributes: { exclude: ["password"] },
      },
      {
        association: "subject",
      },
    ],
  });

  new SuccessResponse("Class test records retrieved successfully", tests).sendResponse(res);
});


// ✅ Get All Class Tests for a Student
export const getClassTestsByStudent = asyncHandler(async (req: Request, res: Response) => {
  const { studentId } = req.params;

  const tests = await ClassTest.findAll({
    where: { studentId },
    include: ["subject", "class"],
  });

  new SuccessResponse("Student test records retrieved successfully", tests).sendResponse(res);
});

// ✅ Update a Test Record
export const updateClassTest = asyncHandler(async (req: Request, res: Response) => {
  const { testId } = req.params;
  const { test1, test2  } = req.body;

  const record = await ClassTest.findByPk(testId);
  if (!record) {
    res.status(404).json({ message: "Class test record not found" });
    return;
  }

  record.test1 = test1 ?? record.test1;
  record.test2 = test2 ?? record.test2;

  record.totalMarkObtained =
    (record.test1 || 0) + (record.test2 || 0);

  await record.save();

  new SuccessResponse("Class test record updated successfully", record).sendResponse(res);
});

export const getTestsWithPendingScores = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { classId, sessionId, term } = req.params;

    // 1️⃣ Get total students in the class
    const students = await Student.findAll({
      where: { classId },
      attributes: ["id"],
    });

    const totalStudents = students.length;

    if (totalStudents === 0) {
      res.status(404).json({ message: "No students found in this class" });
      return;
    }

    // 2️⃣ Get all tests where score is NOT filled
    const pendingTests = await ClassTest.findAll({
      where: {
        classId,
        sessionId,
        term,
        totalMarkObtained: 0, // score not uploaded
      },
      include: [
        {
          model: Subject,
          as: "subject",
          attributes: ["id", "name"],
        },
        {
          model: Student,
          as: "student",
          attributes: ["id"],
        },
      ],
    });

    // 3️⃣ Group by subject (since tests are per student)
    const subjectMap: Record<number, any> = {};

    pendingTests.forEach((test) => {
      const subjectId = test.subjectId;

      if (!subjectMap[subjectId]) {
        subjectMap[subjectId] = {
          subject: test.subjectId,
          totalStudents,
          studentsWithoutScores: 0,
        };
      }

      subjectMap[subjectId].studentsWithoutScores += 1;
    });

const result = Object.values(subjectMap).map((item: any) => ({
  ...item,
  test_status:
    item.studentsWithoutScores === 0 ? "submitted" : "draft",
}));

    new SuccessResponse(
      "Tests with pending score uploads fetched",
      result
    ).sendResponse(res);
  }
);
