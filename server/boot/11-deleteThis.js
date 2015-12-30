module.exports = function(server) {
	
	var User = server.models.user;
	
	var iNeedAPlebPass = User.hashPassword('password');
	
	console.log('iNeedAPlebPass:', iNeedAPlebPass);
};