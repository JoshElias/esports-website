module.exports = function(server) {
    
    var user = server.models.user;
    
    console.log(user.hashPassword('password'));
    
};