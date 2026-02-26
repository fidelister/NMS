import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import Session from "../../models/session/session.model";
import { ClassModel, Student, Subject, Teacher } from "../../models/association.model";
import Timetable from "../../models/timetable/timetable.model";
import SuccessResponse, { getActiveAcademicPeriod } from "../../middlewares/helper";
import { AuthRequest } from "../../middlewares/authMiddleware";

export const createTimetable = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const {
    classId,
    subjectId,
    teacherId,
    day,
    period,
    startTime,
    endTime,
  } = req.body;

  // const activeSession = await Session.findOne({ where: { isActive: true } });
  // if (!activeSession) {
  //   res.status(400).json({ message: "No active session" });
  //   return;
  // }
  const { session, term } = await getActiveAcademicPeriod();
  if (!session || !term) {
    res.status(400).json({ message: "No active academic period found" });
    return;
  }
  const classExists = await ClassModel.findByPk(classId);
  if (!classExists) {
    res.status(400).json({ message: "Class does not exist" });
    return;
  }

  // ✅ 2. Check subject exists
  const subjectExists = await Subject.findByPk(subjectId);
  if (!subjectExists) {
    res.status(400).json({ message: "Subject does not exist" });
    return;
  }

  // ✅ 3. Check teacher exists
  const teacherExists = await Teacher.findByPk(teacherId);
  if (!teacherExists) {
    res.status(400).json({ message: "Teacher does not exist" });
    return;
  }
  // ✅ Ensure teacher teaches subject
  const teachesSubject = await Subject.findOne({
    where: { id: subjectId, teacherId },
  });

  if (!teachesSubject) {
    res.status(400).json({
      message: "Teacher is not assigned to this subject",
    });
    return;
  }
  const existingTimetable = await Timetable.findOne({
    where: {
      classId,
      day,
      period,
      termId: term.id,
      sessionId: session.id,
    },
  });

  if (existingTimetable) {
    res.status(409).json({
      message:
        "Timetable already created for this class, day, and period. You can only edit it.",
    });
    return;
  }
  const timetable = await Timetable.create({
    classId,
    subjectId,
    teacherId,
    sessionId: session.id,
    termId: term.id,
    day,
    period,
    startTime,
    endTime,
  });

  new SuccessResponse("Timetable created successfully", timetable).sendResponse(res);
});
export const getClassTimetable = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { classId } = req.params;

  const { session, term } = await getActiveAcademicPeriod();
  if (!session || !term) {
    res.status(400).json({ message: "No active academic period found" });
    return;
  } const timetable = await Timetable.findAll({
    where: {
      classId,
      termId: term.id,
      sessionId: session.id,
    },
    include: [
      {
        model: Subject,
        as: "subject",
        attributes: ["id", "name"]
      },
      {
        model: Teacher,
        as: "teacher",
        attributes: ["id", "name"]
      }
    ],
    // include: ["subject", "teacher"],
    order: [["day", "ASC"], ["period", "ASC"]],
  });

  new SuccessResponse("Class timetable fetched", timetable).sendResponse(res);
});
export const updateTimetable = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const {
      classId,
      subjectId,
      teacherId,
      day,
      period,
      startTime,
      endTime,
    } = req.body;
    const { session, term } = await getActiveAcademicPeriod();
    if (!session || !term) {
      res.status(400).json({ message: "No active academic period found" });
      return;
    }
    const timetable = await Timetable.findOne({
      where: {
        id,
        sessionId: session.id,
        termId: term.id
      }
    }); if (!timetable) {
      res.status(404).json({ message: "Timetable not found" });
      return;
    }



    // ✅ Validate class (if updating)
    if (classId) {
      const classExists = await ClassModel.findByPk(classId);
      if (!classExists) {
        res.status(400).json({ message: "Class does not exist" });
        return;
      }
      timetable.classId = classId;
    }

    // ✅ Validate subject (if updating)
    if (subjectId) {
      const subjectExists = await Subject.findByPk(subjectId);
      if (!subjectExists) {
        res.status(400).json({ message: "Subject does not exist" });
        return;
      }
      timetable.subjectId = subjectId;
    }

    // ✅ Validate teacher (if updating)
    if (teacherId) {
      const teacherExists = await Teacher.findByPk(teacherId);
      if (!teacherExists) {
        res.status(400).json({ message: "Teacher does not exist" });
        return;
      }
      timetable.teacherId = teacherId;
    }

    // ✅ Ensure teacher teaches subject (after possible updates)
    if (teacherId || subjectId) {
      const subject = await Subject.findOne({
        where: {
          id: timetable.subjectId,
          teacherId: timetable.teacherId,
        },
      });

      if (!subject) {
        res.status(400).json({
          message: "Teacher is not assigned to this subject",
        });
        return;
      }
    }

    // ✅ Other editable fields
    if (day) timetable.day = day;
    if (period) timetable.period = period;
    if (startTime) timetable.startTime = startTime;
    if (endTime) timetable.endTime = endTime;

    await timetable.save();

    new SuccessResponse(
      "Timetable updated successfully",
      timetable
    ).sendResponse(res);
  }
);
export const getTeacherTimetable = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const teacherId = req.user?.id;

    // ✅ Active session
    const { session, term } = await getActiveAcademicPeriod();
    if (!session || !term) {
      res.status(400).json({ message: "No active academic period found" });
      return;
    }

    const timetable = await Timetable.findAll({
      where: {
        teacherId,
        sessionId: session.id,
        termId: term.id
      },
      include: [
        {
          model: ClassModel,
          as: "class",
          attributes: ["id", "name"],
        },
        {
          model: Subject,
          as: "subject",
          attributes: ["id", "name"],
        },
      ],
      order: [
        ["day", "ASC"],
        ["period", "ASC"],
      ],
    });

    new SuccessResponse("Teacher timetable fetched successfully", {
      session: session.name,
      term: term.name,
      timetable,
    }).sendResponse(res);
  }
);
export const getStudentTimetable = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const studentId = req.user?.id;

  // ✅ Get student
  const student = await Student.findByPk(studentId);
  if (!student || !student.classId) {
    res.status(400).json({
      message: "Student is not assigned to any class",
    });
    return;
  }

  // ✅ Get active session
  const { session, term } = await getActiveAcademicPeriod();
  if (!session || !term) {
    res.status(400).json({ message: "No active academic period found" });
    return;
  }

  // ✅ Fetch timetable
  const timetable = await Timetable.findAll({
    where: {
      classId: student.classId,
      sessionId: session.id,
      termId: term.id
    },
    include: [
      {
        model: Subject,
        as: "subject",
        attributes: ["id", "name"],
      },
      {
        model: Teacher,
        as: "teacher",
        attributes: ["id", "name"],
      },
    ],
    order: [
      ["day", "ASC"],     // ✅ correct column
      ["period", "ASC"],  // ✅ correct column
    ],
  });

  return new SuccessResponse("Student timetable fetched successfully", {
    session: session.name,
    term: term.name,
    classId: student.classId,
    timetable,
  }).sendResponse(res);
}
);
export const deleteTimetable = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    // 🔹 Check active session
    const { session, term } = await getActiveAcademicPeriod();
    if (!session || !term) {
      res.status(400).json({ message: "No active academic period found" });
      return;
    }

    // 🔹 Check timetable exists (and belongs to active session)
    const timetable = await Timetable.findOne({
      where: {
        id,
        sessionId: session.id,
        termId: term.id,
      },
    });

    if (!timetable) {
      res.status(404).json({
        message: "Timetable not found for this session",
      });
      return;
    }

    // 🔹 Delete timetable
    await timetable.destroy();

    new SuccessResponse("Timetable deleted successfully", "").sendResponse(res);
  }
);



