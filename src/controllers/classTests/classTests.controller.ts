import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import SuccessResponse from "../../middlewares/helper";
import { ClassModel, Student, Subject } from "../../models/association.model";
import ClassTest from "../../models/ClassTests/classTests.model";
import { AuthRequest } from "../../middlewares/authMiddleware";

// ✅ Add or Upload Class Test Results
export const createClassTest = asyncHandler(async (req: Request, res: Response) => {
  const { studentId, subjectId, classId, term, date, test1, test2, test3, test4 } = req.body;

  const totalMarks = 40;
  const totalMarkObtained =
    (test1 || 0) + (test2 || 0) + (test3 || 0) + (test4 || 0);

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