import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../../database";
import { ClassModel, Student, Subject, Teacher } from "../association.model";
import Session from "../session/session.model";

interface ClassTestAttributes {
  id: number;
  studentId: number;
  subjectId: number;
  classId: number;
  term: string; // Term 1, Term 2, Term 3
  date: Date;
  test1?: number;
  test2?: number;
  // test3?: number;
  // test4?: number;
  totalMarks: number; // Always 40
  totalMarkObtained?: number; // test1 + test2 + test3 + test4
  sessionId?: number;

}

interface ClassTestCreationAttributes
  extends Optional<ClassTestAttributes, "id" | "totalMarkObtained"> { }

class ClassTest
  extends Model<ClassTestAttributes, ClassTestCreationAttributes>
  implements ClassTestAttributes {
  public id!: number;
  public studentId!: number;
  public subjectId!: number;
  public classId!: number;
  public term!: string;
  public sessionId!: number;

  public date!: Date;
  public test1?: number;
  public test2?: number;
  // public test3?: number;
  // public test4?: number;
  public totalMarks!: number;
  public totalMarkObtained?: number;
}

ClassTest.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
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
    classId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "classes", key: "id" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
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
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    test1: { type: DataTypes.FLOAT, defaultValue: 0 },
    test2: { type: DataTypes.FLOAT, defaultValue: 0 },
    // test3: { type: DataTypes.FLOAT, defaultValue: 0 },
    // test4: { type: DataTypes.FLOAT, defaultValue: 0 },
    totalMarks: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 40,
    },
    totalMarkObtained: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    modelName: "ClassTest",
    tableName: "class_tests",
  }
);

// ✅ Associations
ClassTest.belongsTo(Student, { foreignKey: "studentId", as: "student" });
ClassTest.belongsTo(Subject, { foreignKey: "subjectId", as: "subject" });
ClassTest.belongsTo(ClassModel, {
  foreignKey: "classId", as: "class", onDelete: "CASCADE",
  onUpdate: "CASCADE"
});

ClassTest.belongsTo(Session, { foreignKey: "sessionId", as: "session" });
Session.hasMany(ClassTest, { foreignKey: "sessionId", as: "class_tests" });
export default ClassTest;
