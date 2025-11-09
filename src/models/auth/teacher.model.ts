import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../../database';

export interface TeacherAttributes {
  id: number;
  name: string;
  email: string;
  password: string;
  subject?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TeacherCreationAttributes extends Optional<TeacherAttributes, 'id'> {}

class Teacher extends Model<TeacherAttributes, TeacherCreationAttributes> implements TeacherAttributes {
  public id!: number;
  public name!: string;
  public email!: string;
  public password!: string;
  public subject?: string;
}

Teacher.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
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

export default Teacher;
