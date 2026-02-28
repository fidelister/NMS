import asyncHandler from 'express-async-handler';
import { ClassModel, Student, Teacher } from '../../models/association.model';
import { BadRequestsException } from '../../exceptions/bad-request-exceptions';
import SuccessResponse, { getActiveAcademicPeriod, getActiveSession } from '../../middlewares/helper';
import { ERRORCODES } from '../../exceptions/root';
import { Request, Response } from 'express';
import { AuthRequest } from '../../middlewares/authMiddleware';


/**
 * @desc Admin creates a new class
 * @route POST /api/class
 * @access Admin
 */

export const createClass = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { name } = req.body;

  // 🔍 Check if class already exists
  const existing = await ClassModel.findOne({ where: { name } });
  if (existing) {
    res.status(400).json({ message: 'Class already exists.' });
    return;
  }

  // 🔍 Get the active session
  const activeSession = await getActiveSession();
  if (!activeSession) {
    res.status(400).json({ message: "No active session found. Please create or activate a session first." });
    return;
  }

  // ✅ Create class inside active session
  const newClass = await ClassModel.create({
    name,
    sessionId: activeSession.id
  });

  new SuccessResponse('Class created successfully', {
    class: newClass,
  }).sendResponse(res);
});
export const deleteClass = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const user = req.user; // contains { id, role }
  const classRecord = await ClassModel.findOne({ where: { id } });
  if (!classRecord) {
    res.status(404).json({ message: "Class not found." });
    return;
  }
  if (user.role === "admin") {
    // no extra checks
  }
  else if (user.role === "teacher") {
    if (classRecord.teacherId !== user.id) {
      res.status(403).json({
        message: "Access denied. You are not assigned to this class.",
      });
      return;
    }
  }
  else {
    res.status(403).json({ message: "Unauthorized role." });
    return;
  }
  await classRecord.destroy();
  res.status(200).json({
    success: true,
    message: "Class deleted successfully.",
  });
});

export const updateClass = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { id, name, teacherId } = req.body;
    const classData = await ClassModel.findByPk(id);

    if (!classData) {
      res.status(404).json({ message: "Class not found." });
      return;
    }

    // update name
    if (typeof name === "string" && name.trim() !== "") {
      classData.name = name;
    }

    // update teacher
    if (teacherId !== undefined) {
      if (teacherId === null) {
        (classData.teacherId as number | null) = null;
      } else {
        const teacherExists = await Teacher.findByPk(teacherId);
        if (!teacherExists) {
          res.status(404).json({ message: "Teacher not found." });
          return;
        }

        classData.teacherId = teacherId;
      }
    }

    await classData.save();
    new SuccessResponse("Class updated successfully", classData).sendResponse(res);
  }
);
export const changeStudentClass = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {

    const { studentId, newClassId } = req.body;


    // 1️⃣ Get Active Academic Period
    const { session, term } = await getActiveAcademicPeriod();

    if (!session || !term) {

      res.status(400).json({
        message: "No active academic period found"
      });

      return;
    }


    // 2️⃣ Check Student Exists
    const student = await Student.findByPk(studentId);

    if (!student) {

      res.status(404).json({
        message: "Student not found"
      });

      return;
    }


    // 3️⃣ Check Class Exists
    const newClass =
      await ClassModel.findByPk(newClassId);

    if (!newClass) {

      res.status(404).json({
        message: "Class not found"
      });

      return;
    }


    // 4️⃣ Prevent unnecessary update

    if (student.classId === newClassId) {

      res.status(400).json({
        message: "Student is already in this class"
      });

      return;

    }


    // 5️⃣ Save old class

    const oldClassId = student.classId;


    // 6️⃣ Update class

    student.classId = newClassId;

    await student.save();


    // 7️⃣ Optional (Recommended)
    // Save promotion history
    // await StudentClassHistory.create({

    //   studentId,
    //   oldClassId,
    //   newClassId,

    //   sessionId: session.id,

    //   termId: term.id

    // });



    new SuccessResponse(

      "Student promted updated successfully",

      {

        studentId,

        fromClass: oldClassId,

        toClass: newClassId,

        session: session.name,

        term: term.name

      }

    ).sendResponse(res);

  });
  export const promoteClassStudents = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {

    const { fromClassId, toClassId } = req.body;

    // 1️⃣ Get Active Academic Period
    const { session, term } = await getActiveAcademicPeriod();

    if (!session || !term) {
      res.status(400).json({
        message: "No active academic period found"
      });
      return;
    }

    // 2️⃣ Validate Classes
    const fromClass = await ClassModel.findByPk(fromClassId);
    const toClass = await ClassModel.findByPk(toClassId);

    if (!fromClass) {
      res.status(404).json({
        message: "Source class not found"
      });
      return;
    }

    if (!toClass) {
      res.status(404).json({
        message: "Destination class not found"
      });
      return;
    }

    // 3️⃣ Prevent same class promotion
    if (fromClassId === toClassId) {
      res.status(400).json({
        message: "Source and destination classes cannot be the same"
      });
      return;
    }

    // 4️⃣ Get Students
    const students = await Student.findAll({
      where: { classId: fromClassId },
      attributes: ["id"]
    });

    if (students.length === 0) {
      res.status(404).json({
        message: "No students found in this class"
      });
      return;
    }

    // 5️⃣ Promote Students
    await Student.update(
      { classId: toClassId },
      {
        where: { classId: fromClassId }
      }
    );


    new SuccessResponse(
      "Students promoted successfully",
      {
        promotedStudents: students.length,
        fromClass: fromClass.name,
        toClass: toClass.name,
        session: session.name,
        term: term.name
      }
    ).sendResponse(res);

  }
);


