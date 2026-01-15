import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../../database";
import Exam from "./exam.model";
import { Student, Subject } from "../association.model";
import Session from "../session/session.model";

interface ExamResultAttributes {
    id: number;
    examId: number;
    studentId: number;
    term: string;
    sessionId?: number;
    subjectId: number;
    marksObtained: number;
}

interface ExamResultCreationAttributes extends Optional<ExamResultAttributes, "id"> { }

class ExamResult
    extends Model<ExamResultAttributes, ExamResultCreationAttributes>
    implements ExamResultAttributes {
    public id!: number;
    public examId!: number;
    public term!: string;
    public sessionId!: number;
    public studentId!: number;
    public subjectId!: number;
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
        sessionId: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            references: { model: "sessions", key: "id" },
            onDelete: "CASCADE",
        },
        subjectId: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            references: { model: "subjects", key: "id" },
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
        },
        term: {
            type: DataTypes.ENUM("Term 1", "Term 2", "Term 3"),
            allowNull: false,
        },
        marksObtained: {
            type: DataTypes.FLOAT,
            allowNull: false,
            validate: {
                min: 0,
                max: 60, // total marks
            },
        },
    },
    {
        sequelize,
        modelName: "ExamResult",
        tableName: "exam_results",
    }
);
ExamResult.belongsTo(Subject, { foreignKey: "subjectId", as: "subject" }); 
ExamResult.belongsTo(Exam, { foreignKey: "examId", as: "exam" });
ExamResult.belongsTo(Student, { foreignKey: "studentId", as: "student" });
ExamResult.belongsTo(Session, { foreignKey: "sessionId", as: "session" });
Session.hasMany(ExamResult, { foreignKey: "sessionId", as: "exam_results" });
export default ExamResult;
