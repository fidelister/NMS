import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../../database";
import Exam from "./exam.model";
import { Student, Subject, Term } from "../association.model";
import Session from "../session/session.model";

interface ExamResultAttributes {
  id: number;
  examId: number;
  studentId: number;
  subjectId: number;
  sessionId: number;
  termId: number;
  marksObtained: number;
}

interface ExamResultCreationAttributes
  extends Optional<ExamResultAttributes, "id"> { }

class ExamResult
  extends Model<ExamResultAttributes, ExamResultCreationAttributes>
  implements ExamResultAttributes {
  public id!: number;
  public examId!: number;
  public studentId!: number;
  public subjectId!: number;
  public sessionId!: number;
  public termId!: number;
  public marksObtained!: number;
}

ExamResult.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },

    examId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "exams", key: "id" },
    },

    studentId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "students", key: "id" },
    },

    subjectId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "subjects", key: "id" },
    },

    sessionId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "sessions", key: "id" },
      onDelete: "CASCADE",
    },

    termId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "Terms", key: "id" },
      onDelete: "CASCADE",
    },

    marksObtained: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: { min: 0, max: 80},
    },
  },
  {
    sequelize,
    modelName: "ExamResult",
    tableName: "exam_results",
  }
);

// Associations
ExamResult.belongsTo(Subject, { foreignKey: "subjectId", as: "subject" });
ExamResult.belongsTo(Exam, { foreignKey: "examId", as: "exam" });
ExamResult.belongsTo(Student, { foreignKey: "studentId", as: "student" });
ExamResult.belongsTo(Session, { foreignKey: "sessionId", as: "session" });

Session.hasMany(ExamResult, { foreignKey: "sessionId", as: "exam_results" });
ExamResult.belongsTo(Term, { foreignKey: "termId", as: "term" });
Term.hasMany(ExamResult, { foreignKey: "termId", as: "exam_results" });
export default ExamResult;

