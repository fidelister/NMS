import asyncHandler from 'express-async-handler';
import { ClassModel } from '../../models/association.model';
import { BadRequestsException } from '../../exceptions/bad-request-exceptions';
import SuccessResponse, { getActiveSession } from '../../middlewares/helper';
import { ERRORCODES } from '../../exceptions/root';
import { Request, Response } from 'express';


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

