import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../../database';
import Session from '../session/session.model';

export interface TeacherAttributes {
  id: number;
  name: string;
  email: string;
  password: string;
  subject?: string;
  createdAt?: Date;
  updatedAt?: Date;
  // sessionId?: number;

}

export interface TeacherCreationAttributes extends Optional<TeacherAttributes, 'id'> {}

class Teacher extends Model<TeacherAttributes, TeacherCreationAttributes> implements TeacherAttributes {
  public id!: number;
  public name!: string;
  public email!: string;
  public password!: string;
  public subject?: string;
  // public sessionId!: number;

}

Teacher.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    //  sessionId: {
    //   type: DataTypes.INTEGER.UNSIGNED,
    //   allowNull: false,
    //   references: { model: "sessions", key: "id" },
    //   onDelete: "CASCADE",
    // },
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
    subject: { type: DataTypes.STRING, allowNull: true },
  },
  {
    sequelize,
    modelName: 'Teacher',
    tableName: 'teachers',
    timestamps: true,
  }
);
// Teacher.belongsTo(Session, { foreignKey: "sessionId", as: "session" });
// Session.hasMany(Teacher, { foreignKey: "sessionId", as: "teachers" });
export default Teacher;
