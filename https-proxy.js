var https = require("https");
var fs = require("fs");
var express = require("express");

var app  = express();

app.get("*", function(req, res) {
	res.redirect("http://localhost:3000"+req.url);
});


var options = {
  key: fs.readFileSync("C:\\Users\\Sylvanas\\Desktop\\key.pem").toString(),
  cert: fs.readFileSync("C:\\Users\\Sylvanas\\Desktop\\cert.pem").toString()
};

var httpsServer = https.createServer(options, app);

httpsServer.listen(443);
console.log('HTTPS proxy listening at: %s', 443);
