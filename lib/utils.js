var _ = require("underscore");
var loopback = require("loopback");
var async = require("async");
var server = require("../server/server");


function createPromiseCallback() {
    var cb;

    if (!global.Promise) {
        cb = function() {};
        cb.promise = {};
        Object.defineProperty(cb.promise, 'then', { get: throwPromiseNotDefined });
        Object.defineProperty(cb.promise, 'catch', { get: throwPromiseNotDefined });
        return cb;
    }

    var promise = new global.Promise(function(resolve, reject) {
        cb = function(err, data) {
            if (err) return reject(err);
            return resolve(data);
        };
    });
    cb.promise = promise;
    return cb;
}


function throwPromiseNotDefined() {
    throw new Error(
        'Your Node runtime does support ES6 Promises. ' +
        'Set "global.Promise" t``1  o your preferred implementation of promises.');
}

function slugify(string) {
    return (string) ? string.toLowerCase().replace(/-+/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : '';
};

function generateSlug(sourceKey) {
  return function(ctx, next) {
    var properties = ctx.Model.definition.rawProperties;
    var data;
    var newName;
      
    if(typeof ctx.data === "object" && typeof ctx.data[sourceKey] === "string") {
      newName = ctx.data[sourceKey];
      data = ctx.data;
    } else if(typeof ctx.instance === "object" && typeof ctx.instance[sourceKey] === "string") {
      newName = ctx.instance[sourceKey];
      data = ctx.instance;
    }
      
    if (typeof data === "undefined") {
      return next();
    }
    if (typeof data.slug === "object" && typeof data.slug.linked !== "undefined" && !data.slug.linked) {
      return next();
    }
    // If we generated a new slug, update it
    if(typeof data === "object" && typeof newName === "string") {
      var newSlug = slugify(newName);
      if(!ctx.data) {
        ctx.data = {}
      }
      // Determine if we're updating slug or slug.url
      var slugConfig = properties.slug;
      if (typeof slugConfig === "object" 
          && (typeof slugConfig.type === "undefined" 
              || typeof slugConfig.type === "object"
              || slugConfig.type === "object")) {
          
          if (ctx.currentInstance && ctx.currentInstance.slug && !ctx.currentInstance.slug.linked) {
              return next();
          }
          
          if (typeof data.slug !== "object") {
             var clientSlugLinked = (data.slug  && typeof data.slug.linked !== "undefined")
                ? typeof data.slug.linked : undefined;
             var currentSlugLinked = (ctx.currentInstance
                  && ctx.currentInstance.slug
                  && typeof ctx.currentInstance.slug.linked !== "undefined")
                ? typeof ctx.currentInstance.slug.linked : undefined;
             var linked = clientSlugLinked || currentSlugLinked;

             data.slug = {
                  linked: linked
             }
          } else {
            data.slug.url = newSlug;
          }
      } else {
        data.slug = newSlug;
      }
    }
      
    return next();
  }
};




function filterFields(filters) {
    return function(ctx, finalCb) {

        if(ctx.Model.definition.name !== "article") {
            return finalCb();
        }

        var loopbackContext = loopback.getCurrentContext();
        if (!loopbackContext || typeof loopbackContext.active !== "object" || Object.keys(loopbackContext.active).length < 1) {
            return finalCb();
        }

        var req = loopbackContext.active.http.req;
        var User = ctx.Model.app.models.user;


        if(Array.isArray(filters)) {
            async.eachSeries(filters, filterData, finalCb);
        } else {
            filterData(filters, finalCb);
        }


        function filterData(filter, filterCb) {
            var fieldNames = filter.fieldNames;
            var predicate = filter.predicate || defaultPredicate;
            var acceptedRoles = filter.acceptedRoles;

            if(!Array.isArray(fieldNames) || fieldNames.length < 1) {
                return filterCb();
            }

            if (!predicate(ctx.instance || ctx.data)) {
                return filterCb();
            }

            if (!req || !req.accessToken) {
                return removeFields(fieldNames, filterCb);
            }

            User.isInRoles(req.accessToken.userId.toString(), acceptedRoles, function (err, isInRoles) {
                if (err) return filterCb();
                if (isInRoles.none) return removeFields(fieldNames, filterCb);
                else return filterCb();
            });
        }

        function removeFields(fieldNames, removeCb) {
            var data;
            var removeFunc;

            function unsetField(fieldName) {
                data.unsetAttribute(fieldName);
            }

            function deleteField(fieldName) {
                delete data[fieldName];
            }

            if (ctx.instance) {
                data = ctx.instance;
                removeFunc = unsetField;
            } else {
                data = ctx.data;
                removeFunc = deleteField;
            }

            for (var key in fieldNames) {
                removeFunc(fieldNames[key]);
            }

            return removeCb();
        }

        function defaultPredicate(instance) {
            if(!instance || !instance.premium || !instance.premium.isPremium || !instance.premium.expiryDate)
                return false;

            var now = new Date();
            var temp = now < new Date(instance.premium.expiryDate);
            return temp;
        }
    }
};

function filterDocs(filters) {
    return function(ctx, finalCb) {

        var loopbackContext = loopback.getCurrentContext();
        if (!loopbackContext || !loopbackContext.active) {
            return finalCb();
        }
        var req = loopbackContext.active.http.req;
        var User = ctx.Model.app.models.user;


        if(Array.isArray(filters)) {
            async.eachSeries(filters, filterData, finalCb);
        } else {
            filterData(filters, finalCb);
        }


        function filterData(filter, filterCb) {
            var roleNames = filter.acceptedRoles;
            var filter = filter.filter

            if(Object.keys(filter) < 1) {
                return filterCb();
            }

            if (!req || !req.accessToken)
                return addFilter(filter, filterCb);

            User.isInRoles(req.accessToken.userId.toString(), roleNames, function (err, isInRoles) {
                if (err) return filterCb();
                if (isInRoles.none) return addFilter(filter, filterCb);
                else {
                    return filterCb();
                }
            });
        }

        function addFilter(filter, removeCb) {
            if(typeof ctx.query.where !== "object") {
                ctx.query.where = {};
            }

            for(var key in filter) {

                ctx.query.where[key] = filter[key];
            }

            return removeCb();
        }
    }
};

function getEventualValue(ctx, key) {
    if(typeof ctx.data !== "undefined" && typeof ctx.data[key] !== "undefined") {
        return ctx.data[key];
    } else if(typeof ctx.instance !== "undefined" && typeof ctx.instance[key] !== "undefined") {
        return ctx.instance[key];
    } else if(typeof ctx.currentInstance !== "undefined" && typeof ctx.currentInstance[key] !== "undefined") {
        return ctx.currentInstance[key];
    }
}

function getCurrentModelInstances(ctx, finalCb) {

    // Get the active context variables
    var loopbackContext = loopback.getCurrentContext();
    if(!loopbackContext || !loopbackContext.active) {
        return finalCb(undefined, {});
    }

    if(!ctx || !ctx.Model) {
        return finalCb(undefined, {});
    }

    var modelName = ctx.Model.definition.name;
    var req = loopbackContext.active.http.req;


    // Check if we've already cached the current instances
    if(typeof req.currentInstances !== "object") {
        req.currentInstances = {};
    }

    if(Object.keys(req.currentInstances) > 0) {
        return finalCb(undefined, req.currentInstances);
    }

    ctx.Model.find({where:where, fields: {id:true}}, function(err, instances) {
        if(err) return finalCb(err);

        if(instances.length < 1) {
            return finalCb(undefined, {});
        }

        for(var key in instances) {
            var instance = instances[key];

            // Cache the retrived instances
            if(typeof req.modelCache !== "object") {
                req.modelCache = {};
            }

            if(typeof req.modelCache[modelName] !== object) {
                req.modelCache[modelName][instance.id] = instance;
            }

            req.currentInstances[instance.id] = instance;
        }

        return finalCb(undefined, req.currentInstances);
    });
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function convertMillisecondsToDigitalClock(ms) {
    hours = Math.floor(ms / 3600000), // 1 Hour = 36000 Milliseconds
        minutes = Math.floor((ms % 3600000) / 60000), // 1 Minutes = 60000 Milliseconds
        seconds = Math.floor(((ms % 360000) % 60000) / 1000) // 1 Second = 1000 Milliseconds
    return {
        hours : hours,
        minutes : minutes,
        seconds : seconds,
        clock : hours + ":" + minutes + ":" + seconds
    };
}




module.exports = {
    createPromiseCallback : createPromiseCallback,
    generateSlug : generateSlug,
    slugify : slugify,
    filterFields: filterFields,
    filterDocs : filterDocs,
    getEventualValue : getEventualValue,
    getCurrentModelInstances: getCurrentModelInstances,
    getRandomInt : getRandomInt,
    convertMillisecondsToDigitalClock : convertMillisecondsToDigitalClock
};
