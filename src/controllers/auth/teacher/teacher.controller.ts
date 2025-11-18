import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';
import Teacher from '../../../models/auth/teacher.model';
import asyncHandler from 'express-async-handler';
import { BadRequestsException } from '../../../exceptions/bad-request-exceptions';
import { ERRORCODES } from '../../../exceptions/root';
import SuccessResponse, { generateToken, getActiveSession } from '../../../middlewares/helper';
import { NotFoundException } from '../../../exceptions/not-found-exeptions';
import { AuthRequest } from '../../../middlewares/authMiddleware';

// 🟢 Register Teacher
export const registerTeacher = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { name, email, password, subject } = req.body;

    const existing = await Teacher.findOne({ where: { email } });
    if (existing) {
        throw new BadRequestsException('Email already in use', ERRORCODES.BAD_REQUEST);
    }

    const hashed = await bcrypt.hash(password, 10);
    
    const teacher = await Teacher.create({ name, email, password: hashed, subject});

    const token = generateToken({ id: teacher.id, role: 'teacher' });

    new SuccessResponse('Teacher registered successfully.', {
        token,
        teacher: {
            id: teacher.id,
            name: teacher.name,
            email: teacher.email,
            role: 'teacher',
            subject: teacher.subject,
        },
    }).sendResponse(res);
});

// 🟡 Login Teacher
export const loginTeacher = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;

    const teacher = await Teacher.findOne({ where: { email } });
    if (!teacher) {
        res.status(404).json({ message: 'Teacher not found.' });
        return;
    }

    const valid = await bcrypt.compare(password, teacher.password);
    if (!valid) {
        res.status(404).json({ message: 'Invalid credentials.' });
        return;
    }

    const token = generateToken({ id: teacher.id, role: 'teacher' });

    new SuccessResponse('Login successful.', {
        token,
        teacher: {
            id: teacher.id,
            name: teacher.name,
            email: teacher.email,
            role: 'teacher',
            subject: teacher.subject,
        },
    }).sendResponse(res);
});

export const getTeacherProfile = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const teacherId = req.user?.id;
    const teacher = await Teacher.findByPk(teacherId);

    if (!teacher) {
        res.status(404).json({ message: 'Teacher not found.' });
        return;
    }
    const teacherData = teacher.toJSON() as Record<string, any>;
    delete teacherData.password;
    new SuccessResponse('Profile fetched successfully.', { teacher: teacherData }).sendResponse(res);
});

export const getAllTeachers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const teachers = await Teacher.findAll();

    if (!teachers.length) {
        res.status(404).json({ message: 'No teachers found.' });
        return;
    }

    // Remove passwords
    const safeTeachers = teachers.map(t => {
        const teacherData = t.toJSON() as Record<string, any>;
        delete teacherData.password;
        return teacherData;
    });

    new SuccessResponse("Teachers retrieved successfully", { teachers: safeTeachers }).sendResponse(res);
});


// ✅ Get a single teacher
export const getTeacherById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const teacher = await Teacher.findByPk(id);

    if (!teacher) {
        res.status(404).json({ message: 'Teacher not found.' });
        return;
    }

    const teacherData = teacher.toJSON() as Record<string, any>;
    delete teacherData.password;

    new SuccessResponse("Teacher retrieved successfully", { teacher: teacherData }).sendResponse(res);
});


// ✅ Delete a teacher
export const deleteTeacher = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const teacher = await Teacher.findByPk(id);

    if (!teacher) {
        res.status(404).json({ message: 'Teacher not found.' });
        return;
    }
    await teacher.destroy();
    new SuccessResponse("Teacher deleted successfully", {}).sendResponse(res);
});
export const changeTeacherPassword = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const { oldPassword, newPassword } = req.body;
    const teacher = await Teacher.findByPk(req.user?.id);
    if (!teacher) {
        res.status(404).json({ message: 'teacher not found.' });
        return;
    }

    const isMatch = await bcrypt.compare(oldPassword, teacher.password);
    if (!isMatch) {
        res.status(400).json({ message: 'Incorrect current password.' });
        return;
    }

    console.log(newPassword);
    const hashed = await bcrypt.hash(newPassword, 10);
    teacher.password = hashed;
    await teacher.save();

    new SuccessResponse('Password changed successfully.', {}).sendResponse(res);
});
export const updateTeacherDetails = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { teacherId, name} = req.body;

  // Find logged-in student
  const teacher = await Teacher.findByPk(teacherId);
  if (!teacher) {
    res.status(404).json({ message: 'teacher not found.' });
    return;
  }

  // Update only fields that are provided
  if (name) teacher.name = name;

  await teacher.save();

  new SuccessResponse('Teacher details updated successfully.', {
    teacher: {
      id: teacher.id,
      name: teacher.name,
      subject: teacher.subject,
      email: teacher.email,
    },
  }).sendResponse(res);
});
