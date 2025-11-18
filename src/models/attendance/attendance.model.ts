import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../../database";
import { ClassModel, Student, Teacher } from "../association.model";
import Session from "../session/session.model";


export interface AttendanceAttributes {
  id: number;
  studentId: number;
  classId: number;
  teacherId: number;
  date: Date;
  week: number;
  status: "present" | "absent";
  sessionId: number;
}

interface AttendanceCreationAttributes extends Optional<AttendanceAttributes, "id" | "sessionId"> { }

class Attendance extends Model<AttendanceAttributes, AttendanceCreationAttributes>
  implements AttendanceAttributes {
  public id!: number;
  public studentId!: number;
  public classId!: number;
  public teacherId!: number;
  public date!: Date;
  public week!: number;
  public status!: "present" | "absent";
  public sessionId!: number;
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
    sessionId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "sessions", key: "id" },
      onDelete: "CASCADE",
    }
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
Attendance.belongsTo(Session, { foreignKey: "sessionId", as: "session" });
Session.hasMany(Attendance, { foreignKey: "sessionId", as: "attendances" });
export default Attendance;
