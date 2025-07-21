const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const HeroSlide = sequelize.define('HeroSlide', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  subtitle: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: false
  },
  ctaText: {
    type: DataTypes.STRING,
    defaultValue: 'Learn More'
  },
  ctaLink: {
    type: DataTypes.STRING,
    defaultValue: '/apply'
  },
  order: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  timestamps: true,
  tableName: 'hero_slides'
});

module.exports = HeroSlide; 