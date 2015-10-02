var MongoClient = require("mongodb").MongoClient;


MongoClient.connect("mongodb://54.68.67.60:27017/tempostorm", function(err, db) {
	if(err) console.log(err);
	else console.log("success");
});
