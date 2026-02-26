
import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import SuccessResponse, { getActiveAcademicPeriod, getActiveSession, getGrade } from "../../middlewares/helper";
import Session from "../../models/session/session.model";
import PsychomotorAssessment from "../../models/report_card/psychomotor_assessment.model";
import { AuthRequest } from "../../middlewares/authMiddleware";
import { ClassModel, Student } from "../../models/association.model";

export const createOrUpdatePsychomotor = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { studentId, classId, skills, behaviours } = req.body;
  const { session, term } = await getActiveAcademicPeriod();
  if (!session || !term) {
    res.status(400).json({ message: "No active academic period found" });
    return;
  }
  const loggedTeacherId = req.user?.id; // ✅ get logged-in teacher ID
  const loggedUserRole = req.user?.role;
  const classRecord = await ClassModel.findOne({ where: { id: classId } });
  if (!classRecord) {
    res.status(404).json({ success: false, message: "Class not found." });
    return;
  }

  if (loggedUserRole === "teacher") {
    const classRecord = await ClassModel.findOne({
      where: { id: classId, teacherId: loggedTeacherId }
    });

    if (!classRecord) {
      res.status(403).json({
        success: false,
        message: "You are not assigned as the primary teacher for this class.",
      });
      return;
    }
  }
  // 🔹 3. Validate student
  const student = await Student.findOne({ where: { id: studentId, sessionId: session.id } });
  if (!student) {
    res.status(404).json({
      success: false,
      message: "Student not found.",
    });
    return;
  }

  // 🔹 4. Check if student belongs to this class
  if (student.classId !== Number(classId)) {
    res.status(400).json({
      success: false,
      message: "This student is not assigned to the selected class.",
    });
    return;
  }


  let record = await PsychomotorAssessment.findOne({
    where: { studentId, classId, termId: term.id, sessionId: session.id },
  });

  if (record) {
    // update
    record.skills = skills;
    record.behaviours = behaviours;
    await record.save();
  } else {
    // create
    record = await PsychomotorAssessment.create({
      studentId,
      classId,
      term,
      skills,
      behaviours,
      sessionId: session.id,
      termId: term.id,
    });
  }

  new SuccessResponse("Psychomotor assessment saved successfully", record).sendResponse(res);
});
export const getStudentPsychomotor = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const { session, term } = await getActiveAcademicPeriod();
  if (!session || !term) {
    res.status(400).json({ message: "No active academic period found" });
    return;
  }
  const records = await PsychomotorAssessment.findAll({
    where: { studentId, sessionId: session.id, termId: term.id },
    include: [{ model: Session, as: "session" }],
  });

  new SuccessResponse("Psychomotor fetched successfully", records).sendResponse(res);
});
export const getStudentPsy = asyncHandler(async (req: AuthRequest, res: Response) => {
  const studentId = req.user?.id;
  const { session, term } = await getActiveAcademicPeriod();
  if (!session || !term) {
    res.status(400).json({ message: "No active academic period found" });
    return;
  }
  const records = await PsychomotorAssessment.findAll({
    where: { studentId, sessionId: session.id, termId: term.id },
    include: [{ model: Session, as: "session" }],
  });
  new SuccessResponse("Psychomotor fetched successfully", records).sendResponse(res);
});
export const getClassPsychomotor = asyncHandler(async (req, res) => {
  const { classId } = req.params;
  const { session, term } = await getActiveAcademicPeriod();
  if (!session || !term) {
    res.status(400).json({ message: "No active academic period found" });
    return;
  }
  const records = await PsychomotorAssessment.findAll({
    where: { classId, sessionId: session.id, termId: term.id },
    include: [
      {
        model: Student,
        as: "student",
        attributes: ["firstName", "lastName", "nmsNumber"]
      }
    ]
  });
  new SuccessResponse(
    "Psychomotor assessments retrieved successfully",
    records
  ).sendResponse(res);
});
