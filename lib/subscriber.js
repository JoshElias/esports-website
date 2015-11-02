
var key = (global.process.env.NODE_ENV === 'production') ? 'sk_live_FHjluwAxnn5yISh7lMs0vxMx' : 'sk_test_Li9eL2cuhrnTNjp5UJXg7RH6',
    stripe = require('stripe')(key);

function Subscription (user) {
    this.user = user;
};

Subscription.prototype.createStripe = function (cb) {
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

Subscription.prototype.setCard = function (cctoken, cb) {
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

Subscription.prototype.setPlan = function (plan, cctoken, cb) {
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

Subscription.prototype.getSubscription = function (cb) {
    var user = this.user;

    stripe.customers.retrieveSubscription(
        user.subscription.customerID,
        user.subscription.subscriptionID,
        cb
    );
};

Subscription.prototype.updateEmail = function (cb) {
    var user = this.user;

    if(!user.subscription.customerID) { return cb(); }

    stripe.customers.update(user.subscription.customerID, { email: user.email }, function(err, customer) {
        if (err) { return cb(err); }
        return cb();
    });
};

Subscription.prototype.cancel = function (cb) {
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

Subscription.prototype.delete = function (cb) {
    var user = this.user;

    if(user.subscription.customerID){
        stripe.customers.del(
            user.subscription.customerID
        ).then(function(confirmation) {
                user.subscription.customerID = '';

                user.save(function (err) {
                    if (err) { return cb(err); }
                    return cb();
                });
            }, function(err) {
                return cb(err);
            });
    } else {
        return cb();
    }
};

module.exports = Subscription;
