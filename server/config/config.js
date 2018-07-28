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