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
