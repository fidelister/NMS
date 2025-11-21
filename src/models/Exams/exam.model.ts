import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../../database";
import { ClassModel, Student, Subject, Teacher } from "../association.model";
import Session from "../session/session.model";

interface ExamAttributes {
    id: number;
    name: string;
    classId: number;
    subjectId: number;
    term: string;
    date: Date;
    totalMarks: number; // Always 60
  sessionId?: number;

}

interface ExamCreationAttributes extends Optional<ExamAttributes, "id" | "totalMarks"> { }

class Exam extends Model<ExamAttributes, ExamCreationAttributes> implements ExamAttributes {
    public id!: number;
    public name!: string;
    public classId!: number;
    public subjectId!: number;
    public term!: string;
    public date!: Date;
    public totalMarks!: number;
    public sessionId!: number;

}

Exam.init(
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            primaryKey: true,
            autoIncrement: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        classId: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            references: { model: "classes", key: "id" },
            onDelete: "CASCADE",
      onUpdate: "CASCADE",
        },
        subjectId: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            references: { model: "subjects", key: "id" },
        },
        term: {
            type: DataTypes.ENUM("Term 1", "Term 2", "Term 3"),
            allowNull: false,
        },
         sessionId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "sessions", key: "id" },
      onDelete: "CASCADE",
    },
        date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        totalMarks: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 60,
        },
    },
    {
        sequelize,
        modelName: "Exam",
        tableName: "exams",
    }
);

Exam.belongsTo(ClassModel, { foreignKey: "classId", as: "class", onDelete: "CASCADE"});
Exam.belongsTo(Subject, { foreignKey: "subjectId", as: "subject" });
Exam.belongsTo(Session, { foreignKey: "sessionId", as: "session" });
Session.hasMany(Exam, { foreignKey: "sessionId", as: "exams" });
export default Exam;
