import Teacher from './auth/teacher.model';
import Student from './auth/student.model';
import ClassModel from './class/class.model';
import Subject from './subject/subject.model';

// ✅ Class ↔ Subject (One-to-Many)
ClassModel.hasMany(Subject, { foreignKey: 'classId', as: 'subjects' });
Subject.belongsTo(ClassModel, { foreignKey: 'classId', as: 'class' });

// ✅ Teacher ↔ Student (One-to-Many)  // comment this
Teacher.hasMany(Student, { foreignKey: 'teacherId', as: 'students' });
Student.belongsTo(Teacher, { foreignKey: 'teacherId', as: 'teacher' });

// ✅ Class ↔ Student (One-to-Many)
ClassModel.hasMany(Student, { foreignKey: 'classId', as: 'students' });
Student.belongsTo(ClassModel, { foreignKey: 'classId', as: 'class' });

// ✅ Subject ↔ Teacher (One-to-Many)
Teacher.hasMany(Subject, { foreignKey: 'teacherId', as: 'subjects' });
Subject.belongsTo(Teacher, { foreignKey: 'teacherId', as: 'teacher' });

// ✅ Add primary teacher to class
ClassModel.belongsTo(Teacher, { foreignKey: "teacherId", as: "classTeacher" });
Teacher.hasMany(ClassModel, { foreignKey: "teacherId", as: "assignedClasses" });


export { ClassModel, Subject, Teacher, Student };
