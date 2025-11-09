import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../../database";
import { ClassModel, Student, Teacher } from "../association.model";


export interface AttendanceAttributes {
  id: number;
  studentId: number;
  classId: number;
  teacherId: number;
  date: Date;
  week: number;
  status: "present" | "absent";
}

interface AttendanceCreationAttributes extends Optional<AttendanceAttributes, "id"> {}

class Attendance extends Model<AttendanceAttributes, AttendanceCreationAttributes>
  implements AttendanceAttributes {
  public id!: number;
  public studentId!: number;
  public classId!: number;
  public teacherId!: number;
  public date!: Date;
  public week!: number;
  public status!: "present" | "absent";
}

Attendance.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    studentId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    classId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    teacherId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    week: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    status: { type: DataTypes.ENUM("present", "absent"), allowNull: false },
  },
  {
    sequelize,
    modelName: "Attendance",
    tableName: "attendances",
    timestamps: true,
  }
);

// ✅ Associations
Attendance.belongsTo(Student, { foreignKey: "studentId", as: "student" });
Attendance.belongsTo(ClassModel, { foreignKey: "classId", as: "class" });
Attendance.belongsTo(Teacher, { foreignKey: "teacherId", as: "teacher" });

export default Attendance;
