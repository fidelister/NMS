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
  // Check if class exists
  const existing = await ClassModel.findOne({ where: { name } });
  if (existing) {
    res.status(400).json({ message: 'class already exist.' });
    return;
  }
  const activeSession = await getActiveSession();
  const newClass = await ClassModel.create({ name, sessionId: activeSession?.id });

  new SuccessResponse('Class created successfully', {
    class: newClass,
  }).sendResponse(res);
});
