module.exports = {
    heroes: function (Schemas) {
        return function (req, res, next) {
            function getHeroes (callback) {
                Schemas.OverwatchHero.find({
                    isActive: true
                })
                .select('heroName className orderNum')
                .sort({ orderNum: 1 })
                .exec(function (err, heroes) {
                    if (err || !heroes) { return res.json ({ sucess: false }); }
                    return callback(heroes);
                });
            }
            
            getHeroes(function (heroes) {
                return res.json({ success: true, heroes: heroes });
            });
        };
    },
    hero: function (Schemas) {
        return function (req, res, next) {
            var className = req.body.className;
            
            function getHero(callback) {
                Schemas.OverwatchHero.findOne({
                    className: className,
                    isActive: true
                })
                .lean()
                .exec(function (err, hero) {
                    if (err || !hero) { return res.json({ success: false }); }
                    return callback(hero);
                });
            }
            
            function getAbilities (hero, callback) {
                Schemas.OverwatchAbility.find({
                    heroId: hero._id
                })
                .sort({ orderNum: 1 })
                .exec(function (err, abilities) {
                    if (err || !abilities) { return res.json({ success: false }); }
                    hero.overwatchAbilities = abilities;
                    return callback(hero);
                });
            }
            
            getHero(function (hero) {
                getAbilities(hero, function (hero) {
                    return res.json({ success: true, hero: hero });
                });
            });
        };
    }
};