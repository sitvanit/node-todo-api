const env = process.env.NODE_ENV || 'development';

if (env === 'development' || env === 'test') {
    const config = require('./config.json');
    const envConfig = config[env];

    Object.keys(envConfig).forEach((key) => {
        process.env[key] = envConfig[key];
    });
}

/** production **/
// in order to set 'production' env with should use the terminal:
// heroku config -> watch the current env vars.
// heroku config:set JWT_SECRET=gfdsgfdsgnk5jtlinoprjmroenglkfdnglfdkngor21 -> set env var
// heroku config:unset JWT_SECRET -> delete env var
// heroku config:get JWT_SECRET -> get env var

// heroku config:get MONGODB_URI
// mongodb://heroku_pw2k8zxz:vp68nf8cd9dukms9nsv7pa08r8@ds263520.mlab.com:63520/heroku_pw2k8zxz

// mongodb:// -> a protocol - a mongodb connection request
// heroku_pw2k8zxz -> user name
// :
// vp68nf8cd9dukms9nsv7pa08r8 -> password
// @
// ds263520.mlab.com -> the address itself
// :
// 63520 -> port
// /
// heroku_pw2k8zxz -> the DB

