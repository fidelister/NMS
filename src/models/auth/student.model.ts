import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../../database';
import Session from '../session/session.model';

export interface StudentAttributes {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  classId?: number;
  dateOfAdmission?: Date;
  nmsNumber: string;
  teacherId?: number; // assigned teacher
  createdAt?: Date;
  gender: "male" | "female";
  updatedAt?: Date;
  sessionId?: number;
}

export interface StudentCreationAttributes extends Optional<StudentAttributes, 'id' | 'nmsNumber'> { }

class Student extends Model<StudentAttributes, StudentCreationAttributes> implements StudentAttributes {
  public id!: number;
  public firstName!: string;
  public lastName!: string;
  public email!: string;
  public password!: string;
  public classId?: number;
  public dateOfAdmission?: Date;
  public teacherId?: number;
  public nmsNumber!: string;
  public gender!: "male" | "female";
  public sessionId!: number;

}
const generateNmsNumber = () => {
  const random = Math.floor(10000 + Math.random() * 90000);
  return `NMS-${random}`;
};
Student.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    firstName: { type: DataTypes.STRING, allowNull: false },
    lastName: { type: DataTypes.STRING, allowNull: false },
    gender: { type: DataTypes.ENUM("male", "female"), allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
    dateOfAdmission: { type: DataTypes.DATE, allowNull: true },
    classId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    teacherId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    nmsNumber: { type: DataTypes.STRING, allowNull: false, defaultValue: () => generateNmsNumber() },
    sessionId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: "sessions", key: "id" },
      onDelete: "CASCADE",
    },

  },
  {
    sequelize,
    modelName: 'Student',
    tableName: 'students',
    timestamps: true,
  }
);
Student.belongsTo(Session, { foreignKey: "sessionId", as: "session" });
Session.hasMany(Student, { foreignKey: "sessionId", as: "students" });
export default Student;
