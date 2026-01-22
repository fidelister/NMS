import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../../database";
import Session from "../session/session.model";
import { ClassModel, Subject, Teacher } from "../association.model";

interface AssignmentAttributes {
  id: number;
  title: string;
  description: string;
  submissionDate: Date;
  classId: number;
  subjectId: number;
  teacherId: number;
  sessionId: number;
}

interface AssignmentCreationAttributes
  extends Optional<AssignmentAttributes, "id"> {}

class Assignment
  extends Model<AssignmentAttributes, AssignmentCreationAttributes>
  implements AssignmentAttributes {
  public id!: number;
  public title!: string;
  public description!: string;
  public submissionDate!: Date;
  public classId!: number;
  public subjectId!: number;
  public teacherId!: number;
  public sessionId!: number;
}

Assignment.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },

    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

   submissionDate: {
  type: DataTypes.DATEONLY,
  allowNull: false,
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
  },
  {
    sequelize,
    tableName: "assignments",
    modelName: "Assignment",
  }
);

// Associations
Assignment.belongsTo(ClassModel, { foreignKey: "classId", as: "class" });
Assignment.belongsTo(Subject, { foreignKey: "subjectId", as: "subject" });
Assignment.belongsTo(Teacher, { foreignKey: "teacherId", as: "teacher" });
Assignment.belongsTo(Session, { foreignKey: "sessionId", as: "session" });

export default Assignment;
