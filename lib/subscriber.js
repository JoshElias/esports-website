
var prodKey = 'sk_live_FHjluwAxnn5yISh7lMs0vxMx';
var devKey = 'sk_test_Li9eL2cuhrnTNjp5UJXg7RH6';

var stripe = require('stripe')(devKey);

function createStripe(user, cb) {
    var user = this.user;

    stripe.customers.create({
        email: user.email,
        description: user.email
    }, function(err, customer){
        if (err) { return cb(err); }

        user.subscription.customerID = customer.id;

        user.save(function(err){
            if (err) { return cb(err); }
            return cb();
        });
    });
};

function setCard(user, cctoken, cb) {
    var user = this.user;

    var cardHandler = function(err, customer) {
        if (err) { return cb(err); }

        if(!user.subscription.customerID){
            user.subscription.customerID = customer.id;
        }

        var card = customer.cards.data[0];
        user.subscription.last4 = card.last4;
        user.save(function(err){
            if (err) { return cb(err); }
            return cb(false, card.last4);
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
    var self = this,
        user = this.user;

    var subscriptionHandler = function (err, subscription) {
        if(err) { return cb(err); }

        user.subscription.isSubscribed = true;
        user.subscription.plan = plan;
        user.subscription.subscriptionID = subscription.id;
        user.save(function(err){
            if (err) { return cb(err); }
            return cb();
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
            self.setCard(cctoken, function(err){
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
        self.createStripe(planHandler);
    } else {
        planHandler();
    }
};

function getSubscription(user, cb) {
    var user = this.user;

    stripe.customers.retrieveSubscription(
        user.subscription.customerID,
        user.subscription.subscriptionID,
        cb
    );
};

function updateEmail(user, cb) {
    var user = this.user;

    if(!user.subscription.customerID) { return cb(); }

    stripe.customers.update(user.subscription.customerID, { email: user.email }, function(err, customer) {
        if (err) { return cb(err); }
        return cb();
    });
};

function cancel(user, cb) {
    var user = this.user;

    if(user.subscription.customerID){
        stripe.customers.cancelSubscription(
            user.subscription.customerID,
            user.subscription.subscriptionID,
            function(err, confirmation) {
                if (err) { return cb(err); }

                var expiry = confirmation.current_period_end,
                    expiryISO = new Date(expiry*1000).toISOString();

                user.subscription.isSubscribed = false;
                user.subscription.subscriptionID = '';
                user.subscription.expiryDate = expiryISO;

                user.save(function (err) {
                    if (err) { return cb(err); }
                    return cb(null, expiryISO);
                });
            });
    } else {
        return cb(true);
    }
};

module.exports = {
    createStripe : createStripe,
    setCard : setCard,
    setPlan : setPlan,
    getSubscription : getSubscription,
    updateEmail :updateEmail,
    cancel : cancel
}
