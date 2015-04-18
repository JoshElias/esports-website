var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
 
// Hero schema
var heroSchema = new Schema({
    name: { type: String, trim: true },
    description: { type: String, trim: true },
    title: { type: String, trim: true },
    role: { type: String, trim: true },
    heroType: { type: String, trim: true },
    universe: { type: String, trim: true },
    price: {
        gold: { type: Number, default: 0 }
    },
    abilities: [{
        name: { type: String, trim: true },
        abilityType: { type: String, trim: true },
        mana: { type: Number, default: 0 },
        cooldown: { type: Number, default: 0 },
        description: { type: String, trim: true },
        damage: { type: Number, default: 0 },
        healing: { type: Number, default: 0 },
        className: { type: String, trim: true },
        orderNum: { type: Number, default: 0 }
    }],
    talents: [{
        name: { type: String, trim: true },
        tier: { type: Number, default: 1 },
        description: { type: String, trim: true },
        className: { type: String, trim: true },
        orderNum: { type: Number, default: 0 }
    }],
    stats: [{
        level: { type: Number, default: 1 },
        health: { type: Number, default: 0 },
        healthRegen: { type: Number, default: 0 },
        mana: { type: Number, default: 0 },
        manaRegen: { type: Number, default: 0 },
        attackSpeed: { type: Number, default: 0 },
        range: { type: Number, default: 0 },
        damage: { type: Number, default: 0 }
    }],
    orderNum: { type: Number, default: 0 },
    className: { type: String, trim: true },
    active: { type: Boolean, default: false }
});

var Hero = mongoose.model('Hero', heroSchema);

module.exports = Hero;