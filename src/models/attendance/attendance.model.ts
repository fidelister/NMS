import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../../database";
import { ClassModel, Student, Teacher, Term } from "../association.model";
import Session from "../session/session.model";


export interface AttendanceAttributes {
  id: number;
  studentId: number;
  classId: number;
  teacherId: number;
  date: Date;
  week: number;
  status: "present" | "absent" | "late" ;
  termId: number;
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
  public status!: "present" | "absent"| "late" ;
  public termId!: number;
  public sessionId!: number;
}

Attendance.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    studentId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    classId: {
      type: DataTypes.INTEGER.UNSIGNED, allowNull: false, references: { model: "classes", key: "id" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    teacherId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    week: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    status: { type: DataTypes.ENUM("present", "absent", "late"), allowNull: false },
    termId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "Terms", key: "id" },
      onDelete: "CASCADE",
    },
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
Attendance.belongsTo(ClassModel, { foreignKey: "classId", as: "class", onDelete: "CASCADE" });
Attendance.belongsTo(Teacher, { foreignKey: "teacherId", as: "teacher" });
Attendance.belongsTo(Session, { foreignKey: "sessionId", as: "session" });
Session.hasMany(Attendance, { foreignKey: "sessionId", as: "attendances" });
Attendance.belongsTo(Term, { foreignKey: "termId", as: "term" });
Term.hasMany(Attendance, { foreignKey: "termId", as: "attendances" });
export default Attendance;
