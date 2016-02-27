

function premium(instance) {
    if(!instance || !instance.premium || !instance.premium.isPremium || !instance.premium.expiryDate)
        return false;

    var now = new Date();
    var isPremium = now < new Date(instance.premium.expiryDate);
    return isPremium;
}


module.exports = {
    premium: premium
};