
import asyncHandler from 'express-async-handler';
import { ClassModel, Subject, Teacher } from '../../models/association.model';
import { BadRequestsException } from '../../exceptions/bad-request-exceptions';
import SuccessResponse, { getActiveSession } from '../../middlewares/helper';
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
      const activeSession = await getActiveSession();

    const newSubject = await Subject.create({ name, classId: Number(classId), sessionId:activeSession?.id });

    new SuccessResponse('Subject created successfully', {
        subject: newSubject,
    }).sendResponse(res);
});
export const updateSubject = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { name, teacherId } = req.body;

    const subjectData = await Subject.findByPk(id);

    if (!subjectData) {
      res.status(404).json({ message: "Subject not found" });
      return;
    }
    // ✅ Update subject name
    if (typeof name === "string" && name.trim() !== "") {
      subjectData.name = name;
    }
    
    if (teacherId !== undefined) {
      if (teacherId === null) {
    (subjectData.teacherId as number | null) = null;
      } else {
        const teacherExists = await Teacher.findByPk(teacherId);
        if (!teacherExists) {
          res.status(400).json({ message: "Teacher does not exist" });
          return;
        }
        subjectData.teacherId = teacherId;
      }
    }

    await subjectData.save();

    new SuccessResponse("Subject updated successfully", subjectData).sendResponse(res);
  }
);