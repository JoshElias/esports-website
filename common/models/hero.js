module.exports = function(Hero) {
  Hero.observe('before delete', function(ctx, next) {
    var relationsToDestroy = ["talents"];
    utils.destroyRelations(ctx, relationsToDestroy, next);
  });
}
