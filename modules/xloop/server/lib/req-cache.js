var loopback = require("loopback");


function setRequest(ctx) {
    loopback.getCurrentContext().set('req', ctx.req);
}

function getRequest() {
    var loopbackContext = loopback.getCurrentContext();
    if (loopbackContext) {
        return loopbackContext.get("req");
    }
}


module.exports = {
    setRequest: setRequest,
    getRequest: getRequest
};