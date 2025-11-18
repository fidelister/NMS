import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import SuccessResponse, { getActiveSession } from "../../middlewares/helper";
import { ClassModel, Student, Subject } from "../../models/association.model";
import ClassTest from "../../models/ClassTests/classTests.model";
import { AuthRequest } from "../../middlewares/authMiddleware";

// ✅ Add or Upload Class Test Results
export const createClassTest = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { studentId, subjectId, classId, term, date, test1, test2, test3, test4 } = req.body;
  const loggedTeacherId = req.user?.id; // ✅ get logged-in teacher ID

  const classRecord = await ClassModel.findOne({ where: { id: classId, teacherId: loggedTeacherId } });

  if (!classRecord) {
    res.status(403).json({
      success: false,
      message: "You are not assigned as the primary teacher for this class.",
    });
    return;
  }
  // Validate score range (0 to 10)
  const scores = { test1, test2, test3, test4 };
  for (const [key, value] of Object.entries(scores)) {
    if (value !== undefined && (value < 0 || value > 10)) {
      res.status(400).json({
        success: false,
        message: `${key} must be between 0 and 10`,
      });
      return;
    }
  }

  // Check if record already exists
  const existingTest = await ClassTest.findOne({
    where: { studentId, subjectId, classId, term },
  });

  if (existingTest) {
    res.status(400).json({
      success: false,
      message: "Class test has already been uploaded for this student and subject in this term.",
    });
    return;
  }

  // Calculate totals
  const totalMarks = 40;
  const totalMarkObtained =
    (test1 || 0) + (test2 || 0) + (test3 || 0) + (test4 || 0);

  // Create new record
        const activeSession = await getActiveSession();
  
  const newRecord = await ClassTest.create({
    studentId,
    subjectId,
    classId,
    term,
    date,
    test1,
    test2,
    test3,
    test4,
    totalMarks,
    totalMarkObtained,
    sessionId:activeSession?.id
  });

  new SuccessResponse("Class test record created successfully", newRecord).sendResponse(res);
});



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
  const { test1, test2, test3, test4 } = req.body;

  const record = await ClassTest.findByPk(testId);
  if (!record) {
    res.status(404).json({ message: "Class test record not found" });
    return;
  }

  record.test1 = test1 ?? record.test1;
  record.test2 = test2 ?? record.test2;
  record.test3 = test3 ?? record.test3;
  record.test4 = test4 ?? record.test4;

  record.totalMarkObtained =
    (record.test1 || 0) + (record.test2 || 0) + (record.test3 || 0) + (record.test4 || 0);

  await record.save();

  new SuccessResponse("Class test record updated successfully", record).sendResponse(res);
});