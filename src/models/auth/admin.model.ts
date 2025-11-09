import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../../database';

export interface AdminAttributes {
  id: number;
  name: string;
  email: string;
  password: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AdminCreationAttributes extends Optional<AdminAttributes, 'id'> {}

class Admin extends Model<AdminAttributes, AdminCreationAttributes> implements AdminAttributes {
  public id!: number;
  public name!: string;
  public email!: string;
  public password!: string;
}

Admin.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
  },
  {
    sequelize,
    modelName: 'Admin',
    tableName: 'admins',
    timestamps: true,
  }
);

export default Admin;
