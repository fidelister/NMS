import asyncHandler from 'express-async-handler';
import { ClassModel, Student, Subject, Teacher } from '../../models/association.model';
import { BadRequestsException } from '../../exceptions/bad-request-exceptions';
import SuccessResponse from '../../middlewares/helper';
import { ERRORCODES } from '../../exceptions/root';
import { Request, Response } from 'express';
import Session from '../../models/session/session.model';
import Attendance from '../../models/attendance/attendance.model';
import Exam from '../../models/Exams/exam.model';

export const createSession = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { name } = req.body;
    await Session.update({ isActive: false }, { where: {} });

    //  Create new active session
    const s = await Session.create({
        name,
        isActive: true
    });
    new SuccessResponse('New active session created', {
        session: s,
    }).sendResponse(res);
});
export const getAllSessions = asyncHandler(async (req: Request, res: Response) => {
    const sessions = await Session.findAll({
        order: [['createdAt', 'DESC']]
    });

    new SuccessResponse('Sessions retrieved successfully', sessions).sendResponse(res);
});
export const getSessionDetails = asyncHandler(async (req: Request, res: Response) => {
    const { sessionId } = req.params;
    const { include } = req.query;

    const includes = (include as string)?.split(',') || [];

    const session = await Session.findByPk(sessionId);
    if (!session) {
        res.status(400).json({ message: 'Session not found' });
        return;
    }

    const response: any = { session };

    if (includes.includes('classes')) {
        response.classes = await ClassModel.findAll({ where: { sessionId } });
    }
    if (includes.includes('students')) {
        response.students = await Student.findAll({ where: { sessionId } });
    }

    if (includes.includes('subjects')) {
        response.subjects = await Subject.findAll({ where: { sessionId } });
    }

    if (includes.includes('attendance')) {
        response.attendance = await Attendance.findAll({ where: { sessionId } });
    }
    if (includes.includes('exams')) {
        response.attendance = await Exam.findAll({ where: { sessionId } });
    }

    new SuccessResponse('Session details retrieved successfully', response).sendResponse(res);
});

