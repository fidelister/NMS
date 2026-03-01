import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import Admin from '../../../models/auth/admin.model';
import SuccessResponse, { generateToken } from '../../../middlewares/helper';
import { BadRequestsException } from '../../../exceptions/bad-request-exceptions';
import { ERRORCODES } from '../../../exceptions/root';
import { NotFoundException } from '../../../exceptions/not-found-exeptions';
import { AuthRequest } from '../../../middlewares/authMiddleware';
import { ClassModel, Student, Subject, Teacher, Term } from '../../../models/association.model';
import Session from '../../../models/session/session.model';
import { Op, Sequelize } from 'sequelize';
import Attendance from '../../../models/attendance/attendance.model';

export const registerAdmin = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { name, email, password } = req.body;
  const existing = await Admin.findOne({ where: { email } });
  if (existing) {
    res.status(400).json({ message: 'admin already exist.' });
    return;
  }
  const hashed = await bcrypt.hash(password, 10);
  const admin = await Admin.create({ name, email, password: hashed });
  const token = generateToken({ id: admin.id, role: 'admin' });
  new SuccessResponse('Admin registered successfully.', {
    token,
    admin: {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: "admin",
    },
  }).sendResponse(res);
});

export const loginAdmin = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;
  const admin = await Admin.findOne({ where: { email } });
  if (!admin) {
    res.status(400).json({ message: 'admin not found.' });
    return;
  }
  const valid = await bcrypt.compare(password, admin.password);
  if (!valid) {
    res.status(400).json({ message: 'Invalid credentials.' });
    return;
  }
  const token = generateToken({ id: admin.id, role: 'admin' });
  new SuccessResponse('Logged in successfully.', {
    token,
    admin: {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: "admin",
    },
  }).sendResponse(res);

});

export const getAdminProfile = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const adminId = req.user?.id;
  const admin = await Admin.findByPk(adminId);

  if (!admin) {
    throw new NotFoundException('admin not found', ERRORCODES.RESOURCE_NOT_FOUND);
  }
  const adminData = admin.toJSON() as Record<string, any>;
  delete adminData.password;
  new SuccessResponse('Profile fetched successfully.', { admin: adminData }).sendResponse(res);
});

export const changeAdminPassword = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { oldPassword, newPassword } = req.body;
  const admin = await Admin.findByPk(req.user?.id);
  if (!admin) {
    res.status(404).json({ message: 'admin not found.' });
    return;
  }

  const isMatch = await bcrypt.compare(oldPassword, admin.password);
  if (!isMatch) {
    res.status(400).json({ message: 'Incorrect current password.' });
    return;
  }

  console.log(newPassword);
  const hashed = await bcrypt.hash(newPassword, 10);
  admin.password = hashed;
  await admin.save();

  new SuccessResponse('Password changed successfully.', {}).sendResponse(res);
});





export const assignTeacherToSubject = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { teacherId, subjectId, classId } = req.body;

  const teacher = await Teacher.findByPk(teacherId);
  if (!teacher) {
    res.status(404).json({ message: "Teacher not found" });
    return;
  }

  const subject = await Subject.findOne({ where: { id: subjectId, classId } });
  if (!subject) {
    res.status(404).json({ message: "Subject not found for the specified class" });
    return;
  }

  // ✅ Check if teacher is already assigned to this subject in this class
  if (subject.teacherId === teacherId) {
    res.status(400).json({ message: "This teacher is already assigned to this subject in the class" });
    return;
  }

  // ✅ If the subject already has another teacher, prevent reassignment (optional)
  if (subject.teacherId && subject.teacherId !== teacherId) {
    res.status(400).json({
      message: "This subject already has a different teacher assigned",
    });
    return;
  }

  // ✅ Assign teacher to subject
  await subject.update({ teacherId });

  const teacherData = teacher.toJSON() as Record<string, any>;
  delete teacherData.password;

  new SuccessResponse("Teacher successfully assigned to subject", {
    subject,
    teacher: teacherData,
  }).sendResponse(res);
});
export const assignStudentToClass = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { studentId, classId } = req.body;
  const activeSession = await Session.findOne({ where: { isActive: true } });
  if (!activeSession) {
    res.status(400).json({ message: "No active session found" });
    return;
  }

  // 🔍 Find the student in this session
  const student = await Student.findOne({ where: { id: studentId, sessionId: activeSession.id } });
  if (!student) {
    res.status(404).json({ message: "Student not found in the active session." });
    return;
  }

  // 🔍 Find the class
  const classInstance = await ClassModel.findOne({ where: { id: classId, sessionId: activeSession.id } });
  if (!classInstance) {
    res.status(404).json({ message: "Class not found in the active session." });
    return;
  }

  // 🚫 Check if student is already assigned to a class
  if (student.classId) {
    if (student.classId === classId) {
      res.status(400).json({ message: "Student is already assigned to this class" });
      return;
    } else {
      res.status(400).json({ message: "Student is already assigned to another class" });
      return;
    }
  }

  // ✅ Assign student to class
  await student.update({ classId });

  const studentData = student.toJSON() as Record<string, any>;
  delete studentData.password;

  new SuccessResponse("Student successfully assigned to class", {
    student: studentData,
    class: classInstance,
  }).sendResponse(res);
});

export const getStudentsByClass = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { classId } = req.params;

  // ✅ Get active session
  const activeSession = await Session.findOne({ where: { isActive: true } });
  if (!activeSession) {
    res.status(400).json({ message: "No active session found" });
    return;
  }

  // ✅ Only fetch class inside active session
  const classInstance = await ClassModel.findOne({
    where: {
      id: classId,
      sessionId: activeSession.id,
    },
    include: [
      {
        model: Student,
        as: "students",
        attributes: { exclude: ["password"] },
        where: { sessionId: activeSession.id }, // 👈 ensure students belong to session
        required: false, // allow returning class even if no students yet
      },
    ],
  });

  // 🚫 Class not in this session
  if (!classInstance) {
    res.status(404).json({ message: "Class not found in active session" });
    return;
  }

  // 🚫 No students
  if (!classInstance.students || classInstance.students.length === 0) {
    res.status(404).json({ message: "No students found under this class in active session" });
    return;
  }

  // ✅ Success
  new SuccessResponse("Students retrieved successfully", {
    class: classInstance.name,
    students: classInstance.students,
  }).sendResponse(res);
});


export const getAllClasses = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const activeSession = await Session.findOne({ where: { isActive: true } });

  if (!activeSession) {
    res.status(400).json({ message: "No active session found" });
    return;
  }
  const classes = await ClassModel.findAll({
    where: { sessionId: activeSession.id },
    include: [
      {
        model: Subject,
        attributes: ['id', 'name', 'teacherId'],
        as: 'subjects',
      },
      {
        model: Student,
        as: 'students',
        attributes: ['id', 'firstName', 'lastName', 'gender', 'email', 'dateOfAdmission', 'nmsNumber'],
      }
    ]
  });

  if (!classes.length) {
    res.status(404).json({ message: "No classes found for the active session" });
    return;
  }

  new SuccessResponse("Classes retrieved successfully", { classes }).sendResponse(res);
});


export const assignPrimaryTeacherToClass = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { classId, teacherId } = req.body;

  // 🔹 Check active session
  const activeSession = await Session.findOne({ where: { isActive: true } });

  if (!activeSession) {
    res.status(400).json({ message: "No active session found" });
    return;
  }

  // 🔹 Check if class exists
  const classInstance = await ClassModel.findByPk(classId);
  if (!classInstance) {
    res.status(404).json({ message: "Class not found" });
    return;
  }

  // 🔹 Check if teacher exists
  const teacher = await Teacher.findByPk(teacherId);
  if (!teacher) {
    res.status(404).json({ message: "Teacher not found" });
    return;
  }

  // 🔹 Check if same teacher already assigned
  if (classInstance.teacherId && classInstance.teacherId === teacherId) {
    res.status(400).json({
      message: "This teacher is already assigned to this class.",
    });
    return;
  }

  // 🔹 Assign primary teacher
  classInstance.teacherId = teacherId;
  await classInstance.save();

  const teacherData = teacher.toJSON() as Record<string, any>;
  delete teacherData.password;

  new SuccessResponse("Teacher successfully assigned to class as primary teacher", {
    session: activeSession,
    class: classInstance,
    teacher: teacherData,
  }).sendResponse(res);
});

export const getSubjectsByClass = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { classId } = req.params;

  // 🔹 Check active session
  const activeSession = await Session.findOne({ where: { isActive: true } });

  if (!activeSession) {
    res.status(400).json({ message: "No active session found" });
    return;
  }

  // 🔹 Find class and include subjects + teacher
  const classInstance = await ClassModel.findByPk(classId, {
    include: [
      {
        model: Subject,
        as: "subjects",
        include: [
          {
            model: Teacher,
            as: "teacher",
            attributes: ["id", "name", "email"],
          },
        ],
      },
    ],
  });

  if (!classInstance) {
    res.status(404).json({ message: "Class not found." });
    return;
  }

  // 🔹 Handle empty subjects
  if (!classInstance.subjects || classInstance.subjects.length === 0) {
    res.status(404).json({ message: "No subjects found under this class." });
    return;
  }

  // ✅ Response
  new SuccessResponse("Subjects retrieved successfully", {
    session: activeSession,
    class: {
      id: classInstance.id,
      name: classInstance.name,
    },
    subjects: classInstance.subjects,
  }).sendResponse(res);
});

export const getTeacherClasses = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { teacherId } = req.params;

  const teacher = await Teacher.findByPk(Number(teacherId), {
    include: [
      {
        model: ClassModel,
        as: 'assignedClasses', // from your association
        attributes: ['id', 'name', 'teacherId'],
      },
    ],
  });

  if (!teacher) {
    res.status(404).json({ message: "Teacher not found" });
    return;
  }

  // strip sensitive fields
  const teacherData = teacher.toJSON() as Record<string, any>;
  delete teacherData.password;

  // assignedClasses may be undefined if none — normalize to empty array
  const classes = teacherData.assignedClasses ?? [];

  new SuccessResponse('Classes assigned to teacher retrieved successfully', {
    teacher: {
      id: teacherData.id,
      name: teacherData.name,
      email: teacherData.email,
    },
    classes,
  }).sendResponse(res);
});


/**
 * GET /api/teachers/:teacherId/subjects
 * Get subjects assigned to this teacher (a teacher may teach multiple subjects)
 */
export const getTeacherSubjects = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { teacherId } = req.params;

  const teacher = await Teacher.findByPk(Number(teacherId), {
    include: [
      {
        model: Subject,
        as: 'subjects', // from your association
        attributes: ['id', 'name', 'classId', 'teacherId'],
        include: [
          {
            model: ClassModel,
            as: 'class',
            attributes: ['id', 'name'],
          },
        ],
      },
    ],
  });

  if (!teacher) {
    res.status(404).json({ message: "Teacher not found" });
    return;
  }

  const teacherData = teacher.toJSON() as Record<string, any>;
  delete teacherData.password;

  const subjects = teacherData.subjects ?? [];

  new SuccessResponse('Subjects assigned to teacher retrieved successfully', {
    teacher: {
      id: teacherData.id,
      name: teacherData.name,
      email: teacherData.email,
    },
    subjects,
  }).sendResponse(res);
});
export const activeSession = asyncHandler(
  async (req: Request, res: Response) => {
    const activeSession = await Session.findOne({
      where: { isActive: true },
    });

    if (!activeSession) {
      res.status(404).json({ message: "No active session found" });
      return;
    }

    res.status(200).json({
      success: true,
      data: activeSession,
    });
  }
);
// export const getSchoolDashboardStats = asyncHandler(
//   async (req: Request, res: Response): Promise<void> => {
//     // ===============================
//     // 1️⃣ TOTAL STUDENTS
//     // ===============================
//     const totalStudents = await Student.count();

//     // ===============================
//     // 2️⃣ TOTAL TEACHERS
//     // ===============================
//     const totalTeachers = await Teacher.count();

//     // ===============================
//     // 3️⃣ NEWLY ADMITTED STUDENTS (Last 7 Days)
//     // ===============================
//     const sevenDaysAgo = new Date();
//     sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

//     const newlyAdmittedStudents = await Student.findAll({
//       where: {
//         createdAt: {
//           [Op.gte]: sevenDaysAgo,
//         },
//       },
//       attributes: ["id", "firstName", "lastName", "classId", "createdAt"],
//       include: [
//         {
//           model: ClassModel,
//           as: "class",
//           attributes: ["name"],
//         },
//       ],
//       order: [["createdAt", "DESC"]],
//     });

//     // ===============================
//     // 4️⃣ ATTENDANCE TODAY
//     // ===============================
//     const today = new Date().toISOString().split("T")[0];

//     const todayAttendance = await Attendance.findAll({
//       where: {
//         date: today,
//       },
//     });

//     const totalMarkedToday = todayAttendance.length;

//     const presentCount = todayAttendance.filter(
//       (a) => a.status === "present"
//     ).length;

//     const absentCount = todayAttendance.filter(
//       (a) => a.status === "absent"
//     ).length;

//     const presentPercentage =
//       totalMarkedToday === 0
//         ? 0
//         : Number(((presentCount / totalMarkedToday) * 100).toFixed(2));

//     const absentPercentage =
//       totalMarkedToday === 0
//         ? 0
//         : Number(((absentCount / totalMarkedToday) * 100).toFixed(2));

//     // ===============================
//     // 5️⃣ NUMBER OF STUDENTS PER CLASS
//     // ===============================
//     const studentsPerClass = await Student.findAll({
//       attributes: [
//         "classId",
//         [Sequelize.fn("COUNT", Sequelize.col("id")), "studentCount"],
//       ],
//       group: ["classId"],
//       include: [
//         {
//           model: ClassModel,
//           as: "class",
//           attributes: ["name"],
//         },
//       ],
//     });

//     const classDistribution = studentsPerClass.map((item: any) => ({
//       classId: item.classId,
//       className: item.class?.name,
//       studentCount: Number(item.get("studentCount")),
//     }));

//     // ===============================
//     // FINAL RESPONSE
//     // ===============================
//     res.status(200).json({
//       status: "success",
//       data: {
//         totals: {
//           students: totalStudents,
//           teachers: totalTeachers,
//         },
//         attendanceToday: {
//           presentPercentage,
//           absentPercentage,
//           presentCount,
//           absentCount,
//         },
//         newlyAdmittedStudents,
//         studentsPerClass: classDistribution,
//       },
//     });
//   }
// );

export const getSchoolDashboardStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const totalStudents = await Student.count();
  const totalTeachers = await Teacher.count();

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const newlyAdmittedStudents = await Student.findAll({
    where: { createdAt: { [Op.gte]: sevenDaysAgo } },
    attributes: ["id", "firstName", "lastName", "classId", "createdAt"],
    include: [{ model: ClassModel, as: "class", attributes: ["name"] }],
    order: [["createdAt", "DESC"]],
  });

  const today = new Date().toISOString().split("T")[0];

  const todayAttendance = await Attendance.findAll({ where: { date: today } });
  const totalMarkedToday = todayAttendance.length;
  const presentCount = todayAttendance.filter((a) => a.status === "present").length;
  const absentCount = todayAttendance.filter((a) => a.status === "absent").length;
  const lateCount = todayAttendance.filter((a) => a.status === "late").length;

  const presentPercentage = totalMarkedToday === 0 ? 0 : Number(((presentCount / totalMarkedToday) * 100).toFixed(2));
  const absentPercentage = totalMarkedToday === 0 ? 0 : Number(((absentCount / totalMarkedToday) * 100).toFixed(2));
  const latePercentage = totalMarkedToday === 0 ? 0 : Number(((lateCount / totalMarkedToday) * 100).toFixed(2));

  // Robust fallback: fetch classes and count students per class separately
  const classes = await ClassModel.findAll({ attributes: ["id", "name"] });

  const classDistribution = await Promise.all(
    classes.map(async (cls: any) => {
      const studentCount = await Student.count({ where: { classId: cls.id } });
      return {
        classId: cls.id,
        className: cls.name,
        studentCount: Number(studentCount) || 0,
      };
    })
  );

  res.status(200).json({
    status: "success",
    data: {
      totals: { students: totalStudents, teachers: totalTeachers },
      attendanceToday: { presentPercentage, absentPercentage, latePercentage, presentCount, absentCount, lateCount },
      newlyAdmittedStudents,
      studentsPerClass: classDistribution,
    },
  });
});

export const switchActiveTerm = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { termId } = req.params;
    // 1️⃣ Get active session
    const session = await Session.findOne({
      where: { isActive: true }
    });
    if (!session) {
      res.status(400).json({
        message: "No active session found"
      });
      return;
    }
    // 2️⃣ Find term inside active session
    const term =
      await Term.findOne({

        where: {
          id: termId,
          sessionId: session.id
        }

      });


    if (!term) {

      res.status(404).json({
        message: "Term not found in active session"
      });

      return;
    }


    // 3️⃣ Deactivate all terms in session
    await Term.update(
      { isActive: false },
      {
        where: {
          sessionId: session.id
        }
      }
    );


    // 4️⃣ Activate selected term

    term.isActive = true;

    await term.save();


    new SuccessResponse(
      "Active term switched successfully",
      {
        activeSession: session.id,
        activeTerm: term
      }
    ).sendResponse(res);

  });

export const switchSession = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {

    const { sessionId } = req.params;

    // 1️⃣ Find Session
    const session = await Session.findByPk(sessionId, {
      include: [
        {
          model: Term,
          as: "terms"
        }
      ]
    });

    if (!session) {
      res.status(404).json({
        message: "Session not found"
      });
      return;
    }

    // 2️⃣ Deactivate all sessions
    await Session.update(
      { isActive: false },
      { where: {} }
    );

    // 3️⃣ Activate selected session
    session.isActive = true;
    await session.save();

    // 4️⃣ Ensure One Active Term Exists
    const activeTerm = session.terms?.find(t => t.isActive);

    if (!activeTerm) {

      // deactivate any term accidentally active
      await Term.update(
        { isActive: false },
        { where: { sessionId: session.id } }
      );

      // activate Term1 by default
      await Term.update(
        { isActive: true },
        {
          where: {
            sessionId: session.id,
            name: "term1"
          }
        }
      );
    }

    new SuccessResponse(
      "Session switched successfully",
      {
        session: session.name
      }
    ).sendResponse(res);

  }
);
export const deleteSession = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {

    const { sessionId } = req.params;

    // 1️⃣ Find Session
    const session = await Session.findByPk(sessionId);

    if (!session) {
      res.status(404).json({
        message: "Session not found"
      });
      return;
    }

    // 2️⃣ Prevent deleting active session
    if (session.isActive) {
      res.status(400).json({
        message: "Cannot delete active session"
      });
      return;
    }

    // 3️⃣ Delete session (Terms auto-delete)
    await session.destroy();

    new SuccessResponse(
      "Session deleted successfully",
      {
        deletedSession: session.name
      }
    ).sendResponse(res);

  }
);

export const getSessionTerms =
  asyncHandler(async (req: Request, res: Response) => {

    const session =
      await Session.findOne({
        where: { isActive: true }
      });

    if (!session) {

      res.status(400).json({
        message: "No active session"
      });

      return;
    }


    const terms =
      await Term.findAll({

        where: {
          sessionId: session.id
        },

        order: [
          ["id", "ASC"]
        ]

      });


    new SuccessResponse(
      "Session terms retrieved",
      terms
    ).sendResponse(res);

  });