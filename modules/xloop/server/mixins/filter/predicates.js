
function isPremium(data) {
    if (!data || !data.premium || !data.premium.isPremium || !data.premium.expiryDate)
        return false;

    var now = new Date();
    var isPremium = now < new Date(data.premium.expiryDate);
    return isPremium;
}

function isPrivate(data) {
    if (!data || data.isPublic)
        return false;

    return true
}

function isOfficial(data) {
    if(!data || !data.isOfficial)
        return false;

    return true;
}

function isInactive(data) {
    if(!data || data.isActive)
        return false;

    return true;
}



module.exports = {
    premium: isPremium,
    private: isPrivate,
    official: isOfficial,
    inactive: isInactive
};