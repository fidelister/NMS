import jwt, { SignOptions, JwtPayload, Secret } from 'jsonwebtoken';
import Session from '../models/session/session.model';
import { Term } from '../models/association.model';

class SuccessResponse {
  success: boolean;
  message: string;
  data: any;

  constructor(message: string, data: any | null) {
    this.success = true; // As this is for successful responses
    this.message = message;
    this.data = data;
  }

  // Method to send the response
  sendResponse(res: any) {
    res.status(200).json({
      success: this.success,
      message: this.message,
      data: this.data,
    });
  }
}

export default SuccessResponse;

const SECRET = process.env.JWT_SECRET || "NMS2025";
export const generateToken = (payload: object): string => {
  return jwt.sign(payload, SECRET, { expiresIn: '1w' });
};
export const getGrade = (score: number) => {
  if (score >= 70) return { grade: "A", remark: "Excellent" };
  if (score >= 60) return { grade: "B", remark: "Very Good" };
  if (score >= 50) return { grade: "C", remark: "Good" };
  if (score >= 45) return { grade: "D", remark: "Fair" };
  if (score >= 40) return { grade: "E", remark: "Pass" };
  return { grade: "F", remark: "Fail" };
};


export const getActiveSession = async () => {

  const session = await Session.findOne({
    where: { isActive: true }
  });

  if (!session) {
    throw new Error("No active session");
  }

  return session;
};
export const getActiveTerm = async (sessionId:number) => {

  const term = await Term.findOne({
    where: {
      sessionId,
      isActive:true
    }
  });

  if (!term) {
    throw new Error("No active term");
  }

  return term;
};
export const getActiveAcademicPeriod = async () => {

  const session = await Session.findOne({
    where:{isActive:true}
  });

  if(!session){
    throw new Error("No active session");
  }

  const term = await Term.findOne({
    where:{
      sessionId:session.id,
      isActive:true
    }
  });

  if(!term){
    throw new Error("No active term");
  }

  return {
    session,
    term
  };
};