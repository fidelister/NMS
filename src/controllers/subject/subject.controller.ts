
import asyncHandler from 'express-async-handler';
import { ClassModel, Subject } from '../../models/association.model';
import { BadRequestsException } from '../../exceptions/bad-request-exceptions';
import SuccessResponse from '../../middlewares/helper';
import { ERRORCODES } from '../../exceptions/root';
import { Request, Response } from 'express';

/**
 * @desc Admin creates a new subject under a class
 * @route POST /api/class/:classId/subject
 * @access Admin
 */
export const createSubject = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { name, classId } = req.body;

    // Check if class exists
    const existingClass = await ClassModel.findByPk(classId);
    if (!existingClass) {
        res.status(400).json({ message: 'Class does not exist' });
        return;
    }

    // Prevent duplicate subject under same class
    const existingSubject = await Subject.findOne({ where: { name, classId } });
    if (existingSubject) {
        throw new BadRequestsException('Subject already exists in this class', ERRORCODES.BAD_REQUEST);
    }

    const newSubject = await Subject.create({ name, classId: Number(classId) });

    new SuccessResponse('Subject created successfully', {
        subject: newSubject,
    }).sendResponse(res);
});