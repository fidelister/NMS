// import { Op } from "sequelize";
// import Session from "../models/session/session.model";
// import { Student, Subject } from "../models/association.model";
// import ClassTest from "../models/ClassTests/classTests.model";

// const randomScore = (max: number) =>
//   Number((Math.random() * max).toFixed(1));

// export const seedClassTests = async () => {
//   const activeSession = await Session.findOne({ where: { isActive: true } });

//   if (!activeSession) {
//     throw new Error("No active session found");
//   }

//   // ✅ Fetch all students with a class
//  const students = await Student.findAll({
//   where: {
//     classId: {
//       [Op.not]: undefined,
//     },
//   },
// });
//   if (!students.length) {
//     throw new Error("No students found with class assignment");
//   }

//   // ✅ Fetch all subjects
//   const subjects = await Subject.findAll();

//   if (!subjects.length) {
//     throw new Error("No subjects found");
//   }

//   const classTests: any[] = [];

//   for (const student of students) {
//     for (const subject of subjects) {
//       // Random test scores (each max 10 → total 40)
//       const test1 = randomScore(10);
//       const test2 = randomScore(10);
//       const test3 = randomScore(10);
//       const test4 = randomScore(10);

//       const totalMarkObtained =
//         test1 + test2 + test3 + test4;

//       classTests.push({
//         studentId: student.id,
//         subjectId: subject.id,
//         classId: student.classId,
//         sessionId: activeSession.id,
//         term: "Term 1",
//         date: new Date(),
//         test1,
//         test2,
//         test3,
//         test4,
//         totalMarks: 40,
//         totalMarkObtained,
//       });
//     }
//   }

//   await ClassTest.bulkCreate(classTests);

//   console.log(
//     `✅ Class tests seeded successfully (${classTests.length} records)`
//   );
// };
