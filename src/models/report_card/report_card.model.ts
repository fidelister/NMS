import { DataTypes, Model } from "sequelize";
import sequelize from '../../database';
import { ClassModel, Student, Subject } from "../association.model";
import Session from "../session/session.model";

class ReportCard extends Model {
  public id!: number;
  public studentId!: number;
  public classId!: number;
  public subjectId!: number;
  public term!: string;
  public testScore!: number;
  public examScore!: number;
  public totalScore!: number;
  public grade!: string;
  public remark!: string;
  public position!: number | null;
  public average!: number | null;
  public sessionId!: number;
  public subject?: Subject;


}

ReportCard.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    studentId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'students',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    classId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'classes',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    subjectId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'subjects',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    term: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    testScore: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    sessionId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "sessions", key: "id" },
      onDelete: "CASCADE",
    },
    examScore: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    totalScore: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    grade: {
      type: DataTypes.STRING,
    },
    remark: {
      type: DataTypes.STRING,
    },
    position: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
    average: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "ReportCard",
    tableName: "report_cards",
  }
);

// Associations
ReportCard.belongsTo(Student, { as: "student", foreignKey: "studentId" });
ReportCard.belongsTo(ClassModel, { as: "class", foreignKey: "classId", onDelete: "CASCADE", });
ReportCard.belongsTo(Subject, { as: "subject", foreignKey: "subjectId" });
ReportCard.belongsTo(Session, { foreignKey: "sessionId", as: "session" });
Session.hasMany(ReportCard, { foreignKey: "sessionId", as: "report_cards" });
export default ReportCard;
