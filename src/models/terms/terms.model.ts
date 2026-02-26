import { DataTypes, Model, Optional, Sequelize } from "sequelize";

interface TermAttributes {
  id: number;
  name: "term1" | "term2" | "term3";
  sessionId: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface TermCreationAttributes extends Optional<TermAttributes, "id" | "isActive"> {}

export default (sequelize: Sequelize) => {
  class Term extends Model<TermAttributes, TermCreationAttributes> implements TermAttributes {
    public id!: number;
    public name!: "term1" | "term2" | "term3";
    public sessionId!: number;
    public isActive!: boolean;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
  }

  Term.init(
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      name: { type: DataTypes.ENUM("term1", "term2", "term3"), allowNull: false },
      sessionId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      isActive: { type: DataTypes.BOOLEAN, defaultValue: false },
    },
    {
      sequelize,
      tableName: "Terms",
    }
  );

  return Term;
};