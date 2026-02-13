import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';
import Student from '../../../models/auth/student.model';
import asyncHandler from 'express-async-handler';
import { BadRequestsException } from '../../../exceptions/bad-request-exceptions';
import { ERRORCODES } from '../../../exceptions/root';
import SuccessResponse, { generateToken, getActiveSession } from '../../../middlewares/helper';
import { NotFoundException } from '../../../exceptions/not-found-exeptions';
import { AuthRequest } from '../../../middlewares/authMiddleware';
import Session from '../../../models/session/session.model';
import Attendance from '../../../models/attendance/attendance.model';
import { Op } from 'sequelize';
import ClassTest from '../../../models/ClassTests/classTests.model';
import { Subject, Teacher } from '../../../models/association.model';
import ExamResult from '../../../models/Exams/examResults.model';
import Assignment from '../../../models/assignment/assignment.model';

// 🟢 Register Student
export const registerStudent = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { firstName, lastName, email, gender, password, classId, teacherId } = req.body;
    if (!firstName || !lastName || !email || !gender || !password) {
        res.status(400).json({ message: 'Incomplete fields' });
        return;
    }
    const existing = await Student.findOne({ where: { email } });
    if (existing) {
        res.status(400).json({ message: 'student already exist.' });
        return;
    }

    const hashed = await bcrypt.hash(password, 10);
          const activeSession = await getActiveSession();
    
    const student = await Student.create({
        firstName,
        lastName,
        email,
        gender,
        password: hashed,
        classId,
        teacherId,
        dateOfAdmission: new Date(),
        sessionId:activeSession?.id
    });

    const token = generateToken({ id: student.id, role: 'student' });

    new SuccessResponse('Student registered successfully.', {
        token,
        student: {
            id: student.id,
            firstName: student.firstName,
            lastName: student.lastName,
            email: student.email,
            gender: student.gender,
            role: 'student',
            classId: student.classId,
            teacherId: student.teacherId,
            nmsNumber: student.nmsNumber,
            dateOfAdmission: student.dateOfAdmission,
            sessionId:activeSession?.id
        },
    }).sendResponse(res);
});

// 🟡 Login Student
export const loginStudent = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;

    const student = await Student.findOne({ where: { email } });
    if (!student) {
        res.status(400).json({ message: 'student not found.' });
        return;
    }

    const valid = await bcrypt.compare(password, student.password);
    if (!valid) {
        throw new BadRequestsException('Invalid credentials', ERRORCODES.BAD_REQUEST);
    }

    const token = generateToken({ id: student.id, role: 'student' });

    new SuccessResponse('Login successful.', {
        token,
        student: {
            id: student.id,
            firstName: student.firstName,
            lastName: student.lastName,
            email: student.email,
            role: 'student',
            classId: student.classId,
            teacherId: student.teacherId,
            dateOfAdmission: student.dateOfAdmission,
        },
    }).sendResponse(res);
});

export const getStudentProfile = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const studentId = req.user?.id;
    const student = await Student.findByPk(studentId);

    if (!student) {
        res.status(404).json({ message: 'student not found.' });
        return;
    }
    const studentData = student.toJSON() as Record<string, any>;
    delete studentData.password;
    new SuccessResponse('Profile fetched successfully.', { student: studentData }).sendResponse(res);
});

// ✅ Get all students

export const getAllStudents = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const activeSession = await Session.findOne({ where: { isActive: true } });

  if (!activeSession) {
    res.status(400).json({ message: "No active session found" });
    return;
  }
    const students = await Student.findAll({ where: { sessionId: activeSession.id }});

    if (!students.length) {
        res.status(404).json({ message: 'No students found.' });
        return;
    }
    const Students = students.map(t => {
        const studentData = t.toJSON() as Record<string, any>;
        delete studentData.password;
        return studentData;
    });
    new SuccessResponse("Students retrieved successfully", { Students }).sendResponse(res);
});

// ✅ Get a single student
export const getStudentById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    // Get active session
    const activeSession = await Session.findOne({ where: { isActive: true } });

    if (!activeSession) {
        res.status(400).json({ message: "No active session found" });
        return;
    }

    // Fetch the student only if they belong to the active session
    const student = await Student.findOne({
        where: {
            id,
            sessionId: activeSession.id
        }
    });

    if (!student) {
        res.status(404).json({ message: 'Student not found in the active session.' });
        return;
    }

    const studentData = student.toJSON() as Record<string, any>;
    delete studentData.password; // remove sensitive data

    new SuccessResponse("Student retrieved successfully", { student: studentData })
        .sendResponse(res);
});


// ✅ Delete a student
export const deleteStudent = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const student = await Student.findByPk(id);
    if (!student) {
        res.status(404).json({ message: 'Student not found.' });
        return;
    }
    await student.destroy();
    new SuccessResponse("Student deleted successfully", {}).sendResponse(res);
});


export const changeStudentPassword = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const { oldPassword, newPassword } = req.body;
    const student = await Student.findByPk(req.user?.id);
    if (!student) {
        res.status(404).json({ message: 'student not found.' });
        return;
    }

    const isMatch = await bcrypt.compare(oldPassword, student.password);
    if (!isMatch) {
        res.status(400).json({ message: 'Incorrect current password.' });
        return;
    }

    console.log(newPassword);
    const hashed = await bcrypt.hash(newPassword, 10);
    student.password = hashed;
    await student.save();

    new SuccessResponse('Password changed successfully.', {}).sendResponse(res);
});

export const updateStudentDetails = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { studentId, firstName, lastName } = req.body;

    // Find logged-in student
    const student = await Student.findByPk(studentId);
    if (!student) {
        res.status(404).json({ message: 'Student not found.' });
        return;
    }

    // Update only fields that are provided
    if (firstName) student.firstName = firstName;
    if (lastName) student.lastName = lastName;

    await student.save();

    new SuccessResponse('Student details updated successfully.', {
        student: {
            id: student.id,
            firstName: student.firstName,
            lastName: student.lastName,
            email: student.email,
            role: 'student',
            classId: student.classId,
            teacherId: student.teacherId,
            nmsNumber: student.nmsNumber,
            dateOfAdmission: student.dateOfAdmission,
        },
    }).sendResponse(res);
});

export const getStudentDashboardStats = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const studentId = req.user?.id;

    // ✅ Get active session
    const activeSession = await Session.findOne({
      where: { isActive: true },
    });

    if (!activeSession) {
       res.status(400).json({
        success: false,
        message: "No active session found",
      });
    }

    // ✅ Date range for current month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date();
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);
    endOfMonth.setDate(0);
    endOfMonth.setHours(23, 59, 59, 999);

    // ===============================
    // 📌 ATTENDANCE (THIS MONTH)
    // ===============================

    const [presentThisMonth, absentThisMonth] = await Promise.all([
      Attendance.count({
        where: {
          studentId,
          sessionId: activeSession?.id,
          status: "present",
          date: {
            [Op.between]: [startOfMonth, endOfMonth],
          },
        },
      }),

      Attendance.count({
        where: {
          studentId,
          sessionId: activeSession?.id,
          status: "absent",
          date: {
            [Op.between]: [startOfMonth, endOfMonth],
          },
        },
      }),
    ]);

    // ===============================
    // 📌 TOTAL PRESENT (SESSION)
    // ===============================
    const totalSessionPresent = await Attendance.count({
      where: {
        studentId,
        sessionId: activeSession?.id,
        status: "present",
      },
    });

    // ===============================
    // 📌 TESTS TAKEN (SESSION)
    // ===============================
    const testsTakenThisSession = await ClassTest.count({
      where: {
        studentId,
        sessionId: activeSession?.id,
      },
    });

    // ===============================
    // ✅ FINAL RESPONSE
    // ===============================
    new SuccessResponse("Student dashboard stats fetched successfully", {
      attendance: {
        presentThisMonth,
        absentThisMonth,
        totalSessionPresent,
      },
      academics: {
        testsTakenThisSession,
      },
      session: {
        id: activeSession?.id,
        name: activeSession?.name,
      },
    }).sendResponse(res);
  }
);
export const getMyClassTests = asyncHandler(async (req: AuthRequest, res: Response) : Promise<void>=> {
  const studentId = req.user?.id; // ✅ logged-in student
  const { term } = req.body;

  // ✅ Get active session
  const activeSession = await Session.findOne({ where: { isActive: true } });
  if (!activeSession) {
    res.status(400).json({ message: "No active session found" });
    return;
  }

  // ✅ Fetch class tests
  const tests = await ClassTest.findAll({
    where: {
      studentId,
      sessionId: activeSession.id,
      ...(term ? { term } : {}),
    },
    include: [
      {
        model: Subject,
        as: "subject",
        attributes: ["id", "name"],
      },
    ],
    order: [["date", "ASC"]],
  });

  // ✅ Group by subject
  const groupedBySubject: any[] = [];

  for (const test of tests) {
    const subjectId = test.subjectId;

    let subjectEntry = groupedBySubject.find(
      (s) => s.subjectId === subjectId
    );

    if (!subjectEntry) {
      subjectEntry = {
        subjectId,
        subjectName: (test as any).subject?.name,
        tests: [],
      };
      groupedBySubject.push(subjectEntry);
    }

    subjectEntry.tests.push({
      test1: test.test1,
      test2: test.test2,
      // test3: test.test3,
      // test4: test.test4,
      totalMarkObtained: test.totalMarkObtained,
      totalMarks: test.totalMarks,
      date: test.date,
      term: test.term,
    });
  }

  new SuccessResponse("Class tests fetched successfully", {
    session: {
      id: activeSession.id,
      name: activeSession.name,
    },
    totalTests: tests.length,
    subjects: groupedBySubject,
  }).sendResponse(res);
});
export const getMyExamResults = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const studentId = req.user.id; // ✅ logged-in student
  const { term } = req.body;

  // ✅ Get active session
  const activeSession = await Session.findOne({ where: { isActive: true } });
  if (!activeSession) {
    res.status(400).json({ message: "No active session found" });
    return;
  }

  // ✅ Fetch exam results
  const examResults = await ExamResult.findAll({
    where: {
      studentId,
      sessionId: activeSession?.id,
      ...(term ? { term } : {}),
    },
    include: [
      {
        model: Subject,
        as: "subject",
        attributes: ["id", "name"],
      },
    ],
    order: [["id", "ASC"]],
  });

  // ✅ Group by subject
  const groupedResults: any[] = [];

  for (const result of examResults) {
    const subjectId = result.subjectId;

    let subjectEntry = groupedResults.find(
      (s) => s.subjectId === subjectId
    );

    if (!subjectEntry) {
      subjectEntry = {
        subjectId,
        subjectName: (result as any).subject?.name,
        exams: [],
      };
      groupedResults.push(subjectEntry);
    }

    subjectEntry.exams.push({
      marksObtained: result.marksObtained,
      totalMarks: 60,
      term: result.term,
    });
  }

  new SuccessResponse("Exam results fetched successfully", {
    session: {
      id: activeSession?.id,
      name: activeSession?.name,
    },
    totalSubjects: groupedResults.length,
    subjects: groupedResults,
  }).sendResponse(res);
});

export const getStudentAssignments= asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const studentId = req.user?.id;

    const student = await Student.findByPk(studentId);
    if (!student || !student.classId) {
       res.status(400).json({
        message: "Student not assigned to a class",
      });
      return;
    }

    const activeSession = await Session.findOne({
      where: { isActive: true },
    });

    if (!activeSession) {
       res.status(400).json({
        message: "No active session",
      });
      return;
    }

    const assignments = await Assignment.findAll({
      where: {
        classId: student.classId,
        sessionId: activeSession.id,
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
      order: [["submissionDate", "ASC"]],
    });

    new SuccessResponse("Student assignments fetched successfully", assignments)
      .sendResponse(res);
  }
);
