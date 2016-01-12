var stripeKey = require("../server/configs/config." + process.env.NODE_ENV).stripeKey;
var stripe = require('stripe')(stripeKey);

function createStripe(user, cb) {

    stripe.customers.create({
        email: user.email,
        description: user.email
    }, function(err, customer){
        if (err) { return cb(err); }

        user.subscription.customerID = customer.id;

        user.updateAttribute("subscription.customerID", customer.id, function(err) {
            return cb(err);
        });
    });
};

function setCard(user, cctoken, cb) {

    var cardHandler = function(err, customer) {
        if (err) { return cb(err); }

        if(!user.subscription.customerID){
            user.subscription.customerID = customer.id;
        }

        var card = customer.cards.data[0];
        user.updateAttribute("subscription.last4", card.last4, function(err){
            return cb(err, card.last4);
        });
    };

    if(user.subscription.customerID){
        stripe.customers.update(user.subscription.customerID, { card: cctoken }, cardHandler);
    } else {
        stripe.customers.create({
            email: user.email,
            card: cctoken
        }, cardHandler);
    }
};

function setPlan(user, plan, cctoken, cb) {

    var subscriptionHandler = function (err, subscription) {
        if(err) { return cb(err); }

        user.subscription.isSubscribed = true;
        user.subscription.plan = plan;
        user.subscription.subscriptionID = subscription.id;
        user.updateAttribute("subscription", user.subscription, function(err) {
            return cb(err);
        });
    };

    var createSubscription = function () {
        stripe.customers.createSubscription(
            user.subscription.customerID,
            { plan: plan },
            subscriptionHandler
        );
    };

    var planHandler = function (err) {
        if (err) { return cb(err); }

        if (cctoken) {
            setCard(user, cctoken, function(err){
                if (err) return cb(err);
                createSubscription();
            });
        } else {
            if (user.subscription.subscriptionID){
                // update subscription
                stripe.customers.updateSubscription(
                    user.subscription.customerID,
                    user.subscription.subscriptionID,
                    { plan: plan },
                    subscriptionHandler
                );
            } else {
                createSubscription();
            }
        }
    };

    if (!user.subscription.customerID) {
        createStripe(user, planHandler);
    } else {
        planHandler();
    }
};

function getSubscription(user, cb) {
    if(user.subscription && user.subscription.customerID && user.subscription.subscriptionID)
        return cb();

    stripe.customers.retrieveSubscription(
        user.subscription.customerID,
        user.subscription.subscriptionID,
        cb
    );
};

function updateEmail(user, cb) {

    if(!user.subscription.customerID) { return cb(); }

    stripe.customers.update(user.subscription.customerID, { email: user.email }, function(err, customer) {
        if (err) { return cb(err); }
        return cb();
    });
};

function cancel(user, cb) {
    console.log(user.subscription);
    if(!user.subscription || !user.subscription.customerID || !user.subscription.subscriptionID)
        return cb();
    console.log('pass');
    stripe.customers.cancelSubscription(
        user.subscription.customerID,
        user.subscription.subscriptionID,
        function (err, confirmation) {
            console.log("stripe cb", err, confirmation);
            if (err) {
                return cb(err);
            }

            var expiry = confirmation.current_period_end,
                expiryISO = new Date(expiry * 1000).toISOString();

            user.subscription.isSubscribed = false;
            user.subscription.subscriptionID = '';
            user.subscription.expiryDate = expiryISO;

            user.updateAttribute("subscription", user.subscription, function (err) {
                return cb(err, expiryISO);
            });
        });
};

module.exports = {
    createStripe : createStripe,
    setCard : setCard,
    setPlan : setPlan,
    getSubscription : getSubscription,
    updateEmail :updateEmail,
    cancel : cancel
}
