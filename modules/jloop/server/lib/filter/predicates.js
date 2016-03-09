

function premium(data) {
    if(!data || !data.premium || !data.premium.isPremium || !data.premium.expiryDate)
        return false;

    var now = new Date();
    var isPremium = now < new Date(data.premium.expiryDate);
    return isPremium;
}


module.exports = {
    premium: premium
};