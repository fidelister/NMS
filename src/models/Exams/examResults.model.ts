import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../../database";
import Exam from "./exam.model";
import { Student, Subject } from "../association.model";
import Session from "../session/session.model";

interface ExamResultAttributes {
  id: number;
  examId: number;
  studentId: number;
  subjectId: number;
  sessionId: number;
  term: "term1" | "term2" | "term3";
  marksObtained: number;
}

interface ExamResultCreationAttributes
  extends Optional<ExamResultAttributes, "id"> {}

class ExamResult
  extends Model<ExamResultAttributes, ExamResultCreationAttributes>
  implements ExamResultAttributes {
  public id!: number;
  public examId!: number;
  public studentId!: number;
  public subjectId!: number;
  public sessionId!: number;
  public term!: "term1" | "term2" | "term3";
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

    term: {
      type: DataTypes.ENUM("term1", "term2", "term3"),
      allowNull: false,
    },

    marksObtained: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: { min: 0, max: 60 },
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
export default ExamResult;

