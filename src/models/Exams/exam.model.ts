import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../../database";
import { ClassModel, Student, Subject, Teacher } from "../association.model";

interface ExamAttributes {
    id: number;
    name: string;
    classId: number;
    subjectId: number;
    term: string;
    date: Date;
    totalMarks: number; // Always 60
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

Exam.belongsTo(ClassModel, { foreignKey: "classId", as: "class" });
Exam.belongsTo(Subject, { foreignKey: "subjectId", as: "subject" });

export default Exam;
