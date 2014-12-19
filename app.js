require('newrelic');

var cluster = require('cluster'),
    http = require('http'),
	https = require('https'),
	fs = require('graceful-fs'),
    
    express = require("express"),
	bodyParser = require('body-parser'),
    methodOverride = require('method-override'),
    cookieParser = require('cookie-parser'),
    session = require('express-session'),
    favicon = require('serve-favicon'),
    compression = require('compression'),
    
	app = express(),
	MongoStore  = require('connect-mongo')(session),
	mongoose = require('mongoose'),
	uuid = require('node-uuid'),
	dust = require('./lib/dust'),
	dustHelpers = require('dustjs-helpers'),
	cons = require('consolidate'),
	bcrypt = require('bcrypt-nodejs'),
    crypto = require('crypto'),
	path = require('path'),
	routes = require('./routes'),
	gm = require('gm').subClass({ imageMagick: true }),
    Schemas = require('./lib/schemas'),
    jwt = require('jsonwebtoken'),
    expressJwt = require('express-jwt'),
    expressValidator = require('express-validator'),
    Util = require('./lib/util'),
    imgur = require('imgur'),
    async = require('async'),
    subdomain = require('subdomain'),
    passport = require('passport'),
    TwitchStrategy = require('passport-twitch').Strategy,
    BnetStrategy = require('passport-bnet').Strategy,
    Mail = require('./lib/mail'),
    config = require('./lib/config');

if (cluster.isMaster) {

    var numCPUs = require('os').cpus().length;
    
    // Fork workers.
    for (var i = 0; i < numCPUs; i++) {
        cluster.fork();
    }
    
    cluster.on('exit', function(worker, code, signal) {
        console.log('worker ' + worker.process.pid + ' died');
        cluster.fork();
    });
    
} else {

    var JWT_SECRET = '83udfhjdsfh93HJKHel338283ru';

    BASE_DIR = __dirname;

    /* mongoose */
    mongoose.connect('mongodb://localhost:27017/tempostorm');

    app.use(subdomain({ base : config.base, removeWWW : true }));

    app.use('/', express.static(__dirname + '/'));

    app.engine('dust', cons.dust);
    app.set('template_engine', 'dust');
    app.set('views', __dirname + '/views');
    app.set('view engine', 'dust');

    app.use(favicon(path.join(__dirname, 'favicon.ico')));
    app.use(compression({
        threshold: 512
    }));
    app.use(bodyParser.json());
    app.use(expressValidator({
        customValidators: {
            isUsername: function(value) {
                var re = /^[A-Za-z0-9]+(?:[ _-][A-Za-z0-9]+)*$/;
                return value.match(re);
            }
        }
    }));
    app.use('/api', expressJwt({secret: JWT_SECRET}));
    app.use(methodOverride());
    app.use(cookieParser());
    app.use(passport.initialize());
    app.use(session({
        resave: false,
        saveUninitialized: true,
        cookie: { expires: new Date(Date.now() + (60 * 60 * 24 * 7 * 1000)) },
        secret: 'kjadhKJHJKhsdjhd82387sjJK',
        store: new MongoStore({
            db: 'tempostorm'
        })
    }));

    passport.serializeUser(function(user, done) {
      done(null, user.id);
    });

    passport.deserializeUser(function(id, done) {
      Schemas.User.findById(id, function(err, user) {
        done(err, user);
      });
    });

    passport.use(new TwitchStrategy({
        clientID: 'kxjhxkwq4t3egwy3ses7xdpaq314ldm',
        clientSecret: '530y82dvigic8mwlpgk5jqidbkpnld8',
        callbackURL: "http://tempostorm.com/auth/twitch/callback",
        scope: "user_read"
      }, routes.frontend.twitch(Schemas, jwt, JWT_SECRET) ));

    passport.use(new BnetStrategy({
        clientID: 's3ra6aupeur7rvushzbwhf3hux4tcyun',
        clientSecret: 'SBgAxZnwxNFjppBsnesaJbFwtCn6Tjrq',
        callbackURL: "http://localhost:1337/auth/bnet/callback"
      }, routes.frontend.bnet(Schemas) ));

    /* twitch */
    app.get('/auth/twitch', passport.authenticate('twitch'));
    app.get('/auth/twitch/callback', passport.authenticate('twitch', { failureRedirect: '/login' }),
      function(req, res) {
        var token = jwt.sign({ _id: req.user._id.toString() }, JWT_SECRET);
        res.cookie('token', token);
        res.redirect('/');
      });

    /* bnet */
    app.get('/auth/bnet', passport.authenticate('bnet'));
    app.get('/auth/bnet/callback', passport.authenticate('bnet', { failureRedirect: '/login' }),
      function(req, res) {
        var token = jwt.sign({ _id: req.user._id.toString() }, JWT_SECRET);
        res.cookie('token', token);
        res.redirect('/');
      });

    /* spa */
    app.get('/', routes.frontend.index);
    app.get('*', routes.frontend.index);

    /* frontend */
    app.post('/login', routes.frontend.login(Schemas, jwt, JWT_SECRET));
    app.post('/signup', routes.frontend.signup(Schemas, uuid, Mail));
    app.post('/verify', routes.frontend.verifyEmail(Schemas, Mail, jwt, JWT_SECRET));
    app.post('/forgot-password', routes.frontend.forgotPassword(Schemas, Mail, uuid));
    app.post('/forgot-password/reset', routes.frontend.resetPassword(Schemas, Mail));

    app.post('/profile/:username', routes.frontend.profile(Schemas));
    app.post('/profile/:username/activity', routes.frontend.profileActivity(Schemas));
    app.post('/profile/:username/articles', routes.frontend.profileArticles(Schemas));
    app.post('/profile/:username/decks', routes.frontend.profileDecks(Schemas));

    app.post('/articles', routes.frontend.articles(Schemas));
    app.post('/article', routes.frontend.article(Schemas));

    app.post('/decks', routes.frontend.decks(Schemas));
    app.post('/deck', routes.frontend.deck(Schemas));
    app.post('/deckbuilder', routes.frontend.deckBuilder(Schemas, Util));

    app.post('/forum', routes.frontend.forum(Schemas, async));
    app.post('/forum/thread', routes.frontend.forumThread(Schemas));
    app.post('/forum/post', routes.frontend.forumPost(Schemas));

    app.post('/upload', routes.frontend.uploadToImgur(fs, imgur));

    /* frontend - requires login */
    app.post('/api/verify', routes.frontend.verify(Schemas));

    app.post('/api/article/vote', routes.frontend.articleVote(Schemas));
    app.post('/api/article/comment/add', routes.frontend.articleCommentAdd(Schemas, mongoose));

    app.post('/api/deck', routes.frontend.deckEdit(Schemas));
    app.post('/api/deck/add', routes.frontend.deckAdd(Schemas, Util));
    app.post('/api/deck/update', routes.frontend.deckUpdate(Schemas, Util));
    app.post('/api/deck/delete', routes.frontend.deckDelete(Schemas));
    app.post('/api/deck/vote', routes.frontend.deckVote(Schemas));
    app.post('/api/deck/comment/add', routes.frontend.deckCommentAdd(Schemas, mongoose));

    app.post('/api/forum/post/add', routes.frontend.forumPostAdd(Schemas, Util, mongoose));
    app.post('/api/forum/post/comment/add', routes.frontend.forumCommentAdd(Schemas, mongoose));

    app.post('/api/comment/vote', routes.frontend.commentVote(Schemas));

    app.post('/api/profile/:username/decks', routes.frontend.profileDecksLoggedIn(Schemas));

    /* admin */
    app.post('/api/admin/cards', routes.admin.isAdmin(Schemas), routes.admin.cards(Schemas));
    app.post('/api/admin/card', routes.admin.isAdmin(Schemas), routes.admin.card(Schemas));
    app.post('/api/admin/card/add', routes.admin.isAdmin(Schemas), routes.admin.cardAdd(Schemas));
    app.post('/api/admin/card/delete', routes.admin.isAdmin(Schemas), routes.admin.cardDelete(Schemas));
    app.post('/api/admin/card/edit', routes.admin.isAdmin(Schemas), routes.admin.cardEdit(Schemas));

    app.post('/api/admin/decks', routes.admin.isAdmin(Schemas), routes.admin.decks(Schemas));
    app.post('/api/admin/decks/all', routes.admin.isAdmin(Schemas), routes.admin.decksAll(Schemas));
    app.post('/api/admin/deck', routes.admin.isAdmin(Schemas), routes.admin.deck(Schemas));
    app.post('/api/admin/deck/add', routes.admin.isAdmin(Schemas), routes.admin.deckAdd(Schemas, Util));
    app.post('/api/admin/deck/delete', routes.admin.isAdmin(Schemas), routes.admin.deckDelete(Schemas));
    app.post('/api/admin/deck/edit', routes.admin.isAdmin(Schemas), routes.admin.deckEdit(Schemas, Util));

    app.post('/api/admin/articles', routes.admin.isAdmin(Schemas), routes.admin.articles(Schemas));
    app.post('/api/admin/articles/all', routes.admin.isAdmin(Schemas), routes.admin.articlesAll(Schemas));
    app.post('/api/admin/article', routes.admin.isAdmin(Schemas), routes.admin.article(Schemas));
    app.post('/api/admin/article/add', routes.admin.isAdmin(Schemas), routes.admin.articleAdd(Schemas));
    app.post('/api/admin/article/delete', routes.admin.isAdmin(Schemas), routes.admin.articleDelete(Schemas));
    app.post('/api/admin/article/edit', routes.admin.isAdmin(Schemas), routes.admin.articleEdit(Schemas));

    app.post('/api/admin/forum/categories', routes.admin.isAdmin(Schemas), routes.admin.categories(Schemas));
    app.post('/api/admin/forum/category', routes.admin.isAdmin(Schemas), routes.admin.category(Schemas));
    app.post('/api/admin/forum/category/add', routes.admin.isAdmin(Schemas), routes.admin.categoryAdd(Schemas));
    app.post('/api/admin/forum/category/delete', routes.admin.isAdmin(Schemas), routes.admin.categoryDelete(Schemas));
    app.post('/api/admin/forum/category/edit', routes.admin.isAdmin(Schemas), routes.admin.categoryEdit(Schemas));

    app.post('/api/admin/forum/threads', routes.admin.isAdmin(Schemas), routes.admin.threads(Schemas));
    app.post('/api/admin/forum/thread', routes.admin.isAdmin(Schemas), routes.admin.thread(Schemas));
    app.post('/api/admin/forum/thread/add', routes.admin.isAdmin(Schemas), routes.admin.threadAdd(Schemas, mongoose));
    app.post('/api/admin/forum/thread/delete', routes.admin.isAdmin(Schemas), routes.admin.threadDelete(Schemas));
    app.post('/api/admin/forum/thread/edit', routes.admin.isAdmin(Schemas), routes.admin.threadEdit(Schemas));

    app.post('/api/admin/users', routes.admin.isAdmin(Schemas), routes.admin.users(Schemas));
    app.post('/api/admin/user', routes.admin.isAdmin(Schemas), routes.admin.user(Schemas));
    app.post('/api/admin/user/add', routes.admin.isAdmin(Schemas), routes.admin.userAdd(Schemas));
    app.post('/api/admin/user/delete', routes.admin.isAdmin(Schemas), routes.admin.userDelete(Schemas));
    app.post('/api/admin/user/edit', routes.admin.isAdmin(Schemas), routes.admin.userEdit(Schemas));
    app.post('/api/admin/users/admins', routes.admin.isAdmin(Schemas), routes.admin.usersAdmins(Schemas));

    app.post('/api/admin/upload/article', routes.admin.isAdmin(Schemas), routes.admin.uploadArticle(fs, gm));
    app.post('/api/admin/upload/card', routes.admin.isAdmin(Schemas), routes.admin.uploadCard(fs, gm));
    app.post('/api/admin/upload/deck', routes.admin.isAdmin(Schemas), routes.admin.uploadDeck(fs, gm));

    // 404
    app.use(function (req, res, next) {
        res.status(404);

        res.send({ error: 'Not found' });
        return;
    });

    /* server start */
    var server = http.createServer(app);
    server.listen(config.socketPort);
    console.log('Starting server');

}