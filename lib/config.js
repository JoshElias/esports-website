var development = {
  appAddress : 'localhost',
  socketPort : 1337,
  base: 'localhost',
  db: 'mongodb://localhost:27017/tempostorm',
  env : global.process.env.NODE_ENV || 'development',
  tpl: 'dev'
};

var production = {
  appAddress : 'tempostorm.com',
  socketPort : 8080,
  base: 'tempostorm.com',
  db: 'mongodb://104.236.245.160:27017/tempostorm',
  env : global.process.env.NODE_ENV || 'production',
  tpl: 'pro'
};

module.exports = (global.process.env.NODE_ENV === 'production') ? production : development;