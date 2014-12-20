var development = {
  appAddress : 'localhost',
  socketPort : 1337,
  socketHost : '127.0.0.1',
  base: 'localhost',
  env : global.process.env.NODE_ENV || 'development',
  tpl: 'dev'
};

var production = {
  appAddress : 'tempostorm.com',
  socketPort : 80,
  socketHost : '104.236.0.64',
  base: 'tempostorm.com',
  env : global.process.env.NODE_ENV || 'production',
  tpl: 'pro'
};

module.exports = (global.process.env.NODE_ENV === 'production') ? production : development;