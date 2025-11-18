// src/models/session/session.model.ts
import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../../database";

export interface SessionAttributes {
  id: number;
  name: string; // e.g., "2025"
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SessionCreationAttributes extends Optional<SessionAttributes, "id" | "isActive"> {}

class Session extends Model<SessionAttributes, SessionCreationAttributes> implements SessionAttributes {
  public id!: number;
  public name!: string;
  public isActive!: boolean;
}

Session.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false, unique: true },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  },
  { sequelize, modelName: "Session", tableName: "sessions", timestamps: true }
);

export default Session;
