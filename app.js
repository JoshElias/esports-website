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
    multipart = require('connect-multiparty'),
    multipartMiddleware = multipart(),
    
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
    passport = require('passport'),
    TwitchStrategy = require('passport-twitch').Strategy,
    BnetStrategy = require('passport-bnet').Strategy,
    Mail = require('./lib/mail'),
    config = require('./lib/config'),
    amazon = require('./lib/amazon'),
    Subscription = require('./lib/sub'),
    util = require('util'),
    twitch = require("./lib/twitch"),
    twitter = require("./lib/twitter")

/* mongoose */
mongoose.connect(config.DB_URL);

app.use(express.static(__dirname + '/public'));

app.engine('dust', cons.dust);
app.set('template_engine', 'dust');
app.set('views', __dirname + '/public/views');
app.set('view engine', 'dust');

app.use(require('prerender-node').set('prerenderToken', 'XrpCoT3t8wTNledN5pLU'));
app.use(favicon(path.join(__dirname, 'favicon.ico')));
app.use(compression({
    threshold: 512
}));
app.use(bodyParser.json({ limit: '1mb' }));
app.use(expressValidator({
    customValidators: {
        isUsername: function(value) {
            var re = /^[A-Za-z0-9]+(?:[ _-][A-Za-z0-9]+)*$/;
            return value.match(re);
        }
    }
}));
app.use('/api', expressJwt({secret: config.JWT_SECRET}));
app.use(methodOverride());
app.use(cookieParser());
app.use(passport.initialize());
app.use(session({
    resave: false,
    saveUninitialized: true,
    cookie: { expires: new Date(Date.now() + (60 * 60 * 24 * 7 * 1000)) },
    secret: config.SESSION_SECRET,
    store: new MongoStore({
        url: config.DB_URL
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
    clientID: config.TWITCH_ID,
    clientSecret: config.TWITCH_SECRET,
    callbackURL: config.TWITCH_CALLBACK_URL,
    scope: "user_read"
  }, routes.frontend.twitch(Schemas) ));

passport.use(new BnetStrategy({
    clientID: config.BNET_ID,
    clientSecret: config.BNET_SECRET,
    callbackURL: config.BNET_CALLBACK_URL
  }, routes.frontend.bnet(Schemas) ));


/* twitch */
app.get('/auth/twitch', passport.authenticate('twitch'));
app.get('/auth/twitch/callback', passport.authenticate('twitch', { failureRedirect: '/login' }),
  function(req, res) {
    var token = jwt.sign({ _id: req.user._id.toString() }, config.JWT_SECRET);
    res.cookie('token', token);
    res.redirect('/');
});

/* bnet */
app.get('/auth/bnet', passport.authenticate('bnet'));
app.get('/auth/bnet/callback', passport.authenticate('bnet', { failureRedirect: '/login' }),
  function(req, res) {
    var token = jwt.sign({ _id: req.user._id.toString() }, config.JWT_SECRET);
    res.cookie('token', token);
    res.redirect('/');
  });



/* spa */
app.get('/', routes.frontend.index(config));
app.get('*', routes.frontend.index(config));

/* frontend */
app.post('/login', routes.frontend.login(Schemas, jwt, config.JWT_SECRET));
app.post('/signup', routes.frontend.signup(Schemas, uuid, Mail));
app.post('/verify', routes.frontend.verifyEmail(Schemas, Mail, jwt, config.JWT_SECRET));
app.post('/forgot-password', routes.frontend.forgotPassword(Schemas, Mail, uuid));
app.post('/forgot-password/reset', routes.frontend.resetPassword(Schemas, Mail));

twitch.route(app);
twitter.route(app);

app.post('/profile/:username', routes.frontend.profile(Schemas));
app.post('/profile/:username/activity', routes.frontend.profileActivity(Schemas, async));
app.post('/profile/:username/articles', routes.frontend.profileArticles(Schemas));
app.post('/profile/:username/decks', routes.frontend.profileDecks(Schemas));
app.post('/profile/:username/guides', routes.frontend.profileGuides(Schemas));

app.post('/articles', routes.frontend.articles(Schemas));
app.post('/article', routes.frontend.article(Schemas));

app.post('/snapshots', routes.frontend.snapshots(Schemas));
app.post('/snapshot', routes.frontend.snapshot(Schemas));

app.post('/decks', routes.frontend.decks(Schemas));
app.post('/decks/community', routes.frontend.decksCommunity(Schemas));
app.post('/decks/featured', routes.frontend.decksFeatured(Schemas));
app.post('/deck', routes.frontend.deck(Schemas));
app.post('/deckbuilder', routes.frontend.deckBuilder(Schemas, Util));

app.post('/hots/guides', routes.frontend.hots.guides(Schemas));
app.post('/hots/guides/community', routes.frontend.hots.guidesCommunity(Schemas));
app.post('/hots/guides/featured', routes.frontend.hots.guidesFeatured(Schemas));
app.post('/hots/guide', routes.frontend.hots.guide(Schemas));

app.post('/hots/heroes', routes.frontend.hots.heroes(Schemas));
app.post('/hots/heroes/list', routes.frontend.hots.heroesList(Schemas));
app.post('/hots/hero', routes.frontend.hots.hero(Schemas));
app.post('/hots/hero/class', routes.frontend.hots.heroByClass(Schemas));

app.post('/hots/maps', routes.frontend.hots.maps(Schemas));

app.post('/forum', routes.frontend.forum(Schemas, async));
app.post('/forum/thread', routes.frontend.forumThread(Schemas));
app.post('/forum/post', routes.frontend.forumPost(Schemas));

app.post('/banners', routes.frontend.getBanners(Schemas));
app.post('/polls', routes.frontend.pollsPage(Schemas, async));
app.post('/polls/vote', routes.frontend.pollsVote(Schemas));

app.post('/upload', routes.frontend.uploadToImgur(fs, imgur));

/* frontend - requires login */
app.post('/api/verify', routes.frontend.verify(Schemas));

app.post('/api/article/vote', routes.frontend.articleVote(Schemas));
app.post('/api/article/comment/add', routes.frontend.articleCommentAdd(Schemas, mongoose));

app.post('/api/deck', routes.frontend.deckEdit(Schemas));
app.post('/api/deck/add', routes.frontend.deckAdd(Schemas, Util, mongoose));
app.post('/api/deck/update', routes.frontend.deckUpdate(Schemas, Util));
app.post('/api/deck/delete', routes.frontend.deckDelete(Schemas));
app.post('/api/deck/vote', routes.frontend.deckVote(Schemas));
app.post('/api/deck/comment/add', routes.frontend.deckCommentAdd(Schemas, mongoose));

app.post('/api/hots/guide', routes.frontend.hots.guideEdit(Schemas));
app.post('/api/hots/guide/add', routes.frontend.hots.guideAdd(Schemas, Util, mongoose));
app.post('/api/hots/guide/update', routes.frontend.hots.guideUpdate(Schemas, Util));
app.post('/api/hots/guide/delete', routes.frontend.hots.guideDelete(Schemas));
app.post('/api/hots/guide/vote', routes.frontend.hots.guideVote(Schemas));
app.post('/api/hots/guide/comment/add', routes.frontend.hots.guideCommentAdd(Schemas, mongoose));

app.post('/api/forum/post/add', routes.frontend.forumPostAdd(Schemas, Util, mongoose));
app.post('/api/forum/post/comment/add', routes.frontend.forumCommentAdd(Schemas, mongoose));

app.post('/api/comment/vote', routes.frontend.commentVote(Schemas));

app.post('/api/profile/edit', routes.frontend.userProfileEdit(Schemas, uuid, Mail));
app.post('/api/profile/changeEmail', routes.frontend.changeEmail(Schemas, uuid, Mail));
app.post('/api/profile/updateEmail', routes.frontend.updateEmail(Schemas, Mail));
app.post('/api/profile/:username', routes.frontend.userProfile(Schemas));
app.post('/api/profile/:username/decks', routes.frontend.profileDecksLoggedIn(Schemas));
app.post('/api/profile/:username/guides', routes.frontend.profileGuidesLoggedIn(Schemas));

app.post('/api/subscription/setplan', routes.frontend.subSetPlan(Schemas, Subscription));
app.post('/api/subscription/setcard', routes.frontend.subSetCard(Schemas, Subscription));
app.post('/api/subscription/cancel', routes.frontend.subCancel(Schemas, Subscription));

app.post('/api/contact/send', routes.frontend.sendContact(Mail));

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

app.post('/api/admin/heroes', routes.admin.isAdmin(Schemas), routes.admin.heroes(Schemas));
app.post('/api/admin/heroes/all', routes.admin.isAdmin(Schemas), routes.admin.allHeroes(Schemas));
app.post('/api/admin/hero', routes.admin.isAdmin(Schemas), routes.admin.hero(Schemas));
app.post('/api/admin/hero/add', routes.admin.isAdmin(Schemas), routes.admin.heroAdd(Schemas));
app.post('/api/admin/hero/delete', routes.admin.isAdmin(Schemas), routes.admin.heroDelete(Schemas));
app.post('/api/admin/hero/edit', routes.admin.isAdmin(Schemas), routes.admin.heroEdit(Schemas));

app.post('/api/admin/maps', routes.admin.isAdmin(Schemas), routes.admin.maps(Schemas));
app.post('/api/admin/maps/all', routes.admin.isAdmin(Schemas), routes.admin.allMaps(Schemas));
app.post('/api/admin/map', routes.admin.isAdmin(Schemas), routes.admin.map(Schemas));
app.post('/api/admin/map/add', routes.admin.isAdmin(Schemas), routes.admin.mapAdd(Schemas));
app.post('/api/admin/map/delete', routes.admin.isAdmin(Schemas), routes.admin.mapDelete(Schemas));
app.post('/api/admin/map/edit', routes.admin.isAdmin(Schemas), routes.admin.mapEdit(Schemas));

app.post('/api/admin/guides', routes.admin.isAdmin(Schemas), routes.admin.guides(Schemas));
app.post('/api/admin/guides/all', routes.admin.isAdmin(Schemas), routes.admin.allGuides(Schemas));
app.post('/api/admin/guide', routes.admin.isAdmin(Schemas), routes.admin.guide(Schemas));
app.post('/api/admin/guide/add', routes.admin.isAdmin(Schemas), routes.admin.guideAdd(Schemas, Util, mongoose));
app.post('/api/admin/guide/delete', routes.admin.isAdmin(Schemas), routes.admin.guideDelete(Schemas));
app.post('/api/admin/guide/edit', routes.admin.isAdmin(Schemas), routes.admin.guideEdit(Schemas, Util));

app.post('/api/admin/articles', routes.admin.isAdmin(Schemas), routes.admin.articles(Schemas));
app.post('/api/admin/articles/all', routes.admin.isAdmin(Schemas), routes.admin.articlesAll(Schemas));
app.post('/api/admin/article', routes.admin.isAdmin(Schemas), routes.admin.article(Schemas));
app.post('/api/admin/article/add', routes.admin.isAdmin(Schemas), routes.admin.articleAdd(Schemas));
app.post('/api/admin/article/delete', routes.admin.isAdmin(Schemas), routes.admin.articleDelete(Schemas));
app.post('/api/admin/article/edit', routes.admin.isAdmin(Schemas), routes.admin.articleEdit(Schemas));

app.post('/api/admin/article/names', routes.admin.isAdmin(Schemas), routes.admin.articleGetNames(Schemas, async));

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
app.post('/api/admin/users/providers', routes.admin.isAdmin(Schemas), routes.admin.usersProviders(Schemas));

app.post('/api/admin/upload/article', routes.admin.isAdmin(Schemas), multipartMiddleware, routes.admin.uploadArticle(fs, gm, amazon));
app.post('/api/admin/upload/card', routes.admin.isAdmin(Schemas), multipartMiddleware, routes.admin.uploadCard(fs, gm, amazon));
app.post('/api/admin/upload/deck', routes.admin.isAdmin(Schemas), multipartMiddleware, routes.admin.uploadDeck(fs, gm, amazon));
app.post('/api/admin/upload/polls', routes.admin.isAdmin(Schemas), multipartMiddleware, routes.admin.uploadPoll(fs, gm, amazon));
app.post('/api/admin/upload/banners', routes.admin.isAdmin(Schemas), multipartMiddleware, routes.admin.uploadBanner(fs, gm, amazon));

app.post('/api/admin/polls', routes.admin.isAdmin(Schemas), routes.admin.polls(Schemas));
app.post('/api/admin/poll', routes.admin.isAdmin(Schemas), routes.admin.poll(Schemas));
app.post('/api/admin/poll/delete', routes.admin.isAdmin(Schemas), routes.admin.pollDelete(Schemas));
app.post('/api/admin/poll/add', routes.admin.isAdmin(Schemas), routes.admin.pollAdd(Schemas));
app.post('/api/admin/poll/edit', routes.admin.isAdmin(Schemas), routes.admin.pollEdit(Schemas));

app.post('/api/admin/snapshots', routes.admin.isAdmin(Schemas), routes.admin.snapshots(Schemas));
app.post('/api/admin/snapshot', routes.admin.isAdmin(Schemas), routes.admin.snapshot(Schemas));
app.post('/api/admin/snapshot/latest', routes.admin.isAdmin(Schemas), routes.admin.snapshotLatest(Schemas));
app.post('/api/admin/snapshot/add', routes.admin.isAdmin(Schemas), routes.admin.snapshotAdd(Schemas));
app.post('/api/admin/snapshot/delete', routes.admin.isAdmin(Schemas), routes.admin.snapshotDelete(Schemas));
app.post('/api/admin/snapshot/edit', routes.admin.isAdmin(Schemas), routes.admin.snapshotEdit(Schemas));

app.post('/api/admin/banners', routes.admin.isAdmin(Schemas), routes.admin.banners(Schemas));
app.post('/api/admin/banners/order', routes.admin.isAdmin(Schemas), routes.admin.bannersOrder(Schemas));
app.post('/api/admin/banner', routes.admin.isAdmin(Schemas), routes.admin.banner(Schemas));
app.post('/api/admin/banner/delete', routes.admin.isAdmin(Schemas), routes.admin.bannerDelete(Schemas));
app.post('/api/admin/banner/add', routes.admin.isAdmin(Schemas), routes.admin.bannerAdd(Schemas));
app.post('/api/admin/banner/edit', routes.admin.isAdmin(Schemas), routes.admin.bannerEdit(Schemas));


app.post('/api/admin/id', routes.admin.isAdmin(Schemas), routes.admin.getObjectID(mongoose));

// 404
app.use(function (req, res, next) {
    res.status(404);

    res.send({ error: 'Not found' });
    return;
});

/* server start */
var server = http.createServer(app);
server.listen(config.APP_PORT);
console.log('Starting server on port: '+config.APP_PORT);
