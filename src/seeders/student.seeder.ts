// import bcrypt from "bcrypt";
// import Session from "../models/session/session.model";
// import { Student } from "../models/association.model";
// import { StudentCreationAttributes } from "../models/auth/student.model";

// export const seedStudents = async () => {
//   const activeSession = await Session.findOne({ where: { isActive: true } });

//   if (!activeSession) {
//     throw new Error("No active session found");
//   }

//   // ✅ Get existing student count
//   const existingCount = await Student.count();

//   const classIds = [3, 4, 5, 6, 7, 8]; // 6 classes
//   const students: StudentCreationAttributes[] = [];

//   // ✅ Start AFTER existing students
//   let studentCounter = existingCount + 1;

//   // ✅ Hash password ONCE (performance best practice)
//   const hashedPassword = await bcrypt.hash("password123", 10);

//   for (const classId of classIds) {
//     for (let i = 1; i <= 10; i++) {
//       students.push({
//         firstName: `Student${studentCounter}`,
//         lastName: `Lastname${studentCounter}`,
//         gender: studentCounter % 2 === 0 ? "male" : "female",
//         email: `student${studentCounter}@school.com`, // ✅ guaranteed unique
//         password: hashedPassword,
//         sessionId: activeSession.id,
//         classId,
//       });

//       studentCounter++;
//     }
//   }

//   await Student.bulkCreate(students);

//   console.log("✅ 60 NEW students seeded successfully with unique emails");
// };
