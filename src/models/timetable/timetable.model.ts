import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../../database";
import { ClassModel, Subject, Teacher, Term } from "../association.model";
import Session from "../session/session.model";

interface TimetableAttributes {
  id: number;
  classId: number;
  subjectId: number;
  teacherId: number;
  sessionId: number;
  termId: number;
  day: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday";
  period: number; // 1 – 7
  startTime: string; // "08:00"
  endTime: string;   // "09:00"
}

interface TimetableCreationAttributes
  extends Optional<TimetableAttributes, "id"> {}

class Timetable
  extends Model<TimetableAttributes, TimetableCreationAttributes>
  implements TimetableAttributes {
  public id!: number;
  public classId!: number;
  public subjectId!: number;
  public teacherId!: number;
  public sessionId!: number;
  public termId!: number;
  public day!: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday";
  public period!: number;
  public startTime!: string;
  public endTime!: string;
}

Timetable.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },

    classId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },

    subjectId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },

    teacherId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },

    sessionId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },

  termId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "Terms", key: "id" },
      onDelete: "CASCADE",
    },

    day: {
      type: DataTypes.ENUM(
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday"
      ),
      allowNull: false,
    },

    period: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1, max: 7 },
    },

    startTime: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    endTime: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "Timetable",
    tableName: "timetables",
    indexes: [
      {
        unique: true,
        fields: ["classId", "sessionId", "termId", "day", "period"],
      },
    ],
  }
);

// Associations
Timetable.belongsTo(ClassModel, { foreignKey: "classId", as: "class" });
Timetable.belongsTo(Subject, { foreignKey: "subjectId", as: "subject" });
Timetable.belongsTo(Teacher, { foreignKey: "teacherId", as: "teacher" });
Timetable.belongsTo(Session, { foreignKey: "sessionId", as: "session" });
Timetable.belongsTo(Term, { foreignKey: "termId", as: "term" });
Term.hasMany(Timetable, { foreignKey: "termId", as: "timetables" });
Session.hasMany(Timetable, { foreignKey: "sessionId", as: "timetables" });
export default Timetable;
