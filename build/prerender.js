const fs     = require('fs');
const path   = require('path');
const {argv} = require('yargs');
const util   = require('util');
const dotenv = require('dotenv');
const http   = require('http');
const https  = require('https');
const webpack = require('webpack');
const exec   = util.promisify(require('child_process').exec);

const PrerenderSPAPlugin = require('prerender-spa-plugin');

// Prep env
const root = path.resolve('');
const env  = argv.mode || 'production';

dotenv.config({
    path: path.resolve('.env' + (env ? '.' + env : ''))
});

// Prep config
let config = require(path.resolve('prerender.config.js'));

//
async function start(config) {
    
    let indexExists = false;
    let indexPath = config.indexDir || path.resolve('build/index.js');

    await new Promise((resolve) => {
        if (fs.existsSync(indexPath)) {
            indexExists = true;
        }

        resolve();
    });

    if (!indexExists) {
        console.log('> Error: ' + indexPath + ' does not exist.');
        console.log('');

        return;
    }

    // Fetch Dynamic Routes

    let i, ii;

    config.routes = config.routes || [];
    config.dynamicRoutes = config.dynamicRoutes || [];

    console.log('> Fetching dynamic routes');

    for (i = 0, ii = config.dynamicRoutes.length; i < ii; i++) {
        config.dynamicRoutes[i].protocol = config.dynamicRoutes[i].url.substring(0, 5) === 'https' ? 'https': 'http';

        await new Promise((resolve) => {
            let cmd = config.dynamicRoutes[i].protocol === 'http' ? http : https;
            
            console.log( '  - ' + config.dynamicRoutes[i].url);

            cmd.get(config.dynamicRoutes[i].url, (res) => {
                let data = '';

                res.on('data', (chunk) => { data += chunk; });

                res.on('end', () => {
                    let res = JSON.parse(data);
                    let routes = config.dynamicRoutes[i].cb(res);

                    config.routes = config.routes.concat(routes);

                    resolve();
                });
            });
        });
    }

    // Run prerender

    console.log('');
    console.log('> Run prerender');

    delete config.dynamicRoutes;

    await new Promise((resolve) => {
        let prerender = new PrerenderSPAPlugin(config);
        
        let wp = webpack({
            entry: indexPath, // Dummy entry
        }, (err) => {
            if (err) {
                console.log(err);
            }

            resolve();
        });
        
        prerender.apply(wp);
    });

    // Reset css directory.

    console.log('');
    console.log('> Reset css directory');

    await exec('rm -rf ' + root + '/prerender/css');
    await exec('rm -rf ' + root + '/prerender/img');

    await exec('cp -r ' + root + '/dist/css ' + root + '/prerender/css');
    await exec('cp -r ' + root + '/dist/img ' + root + '/prerender/img');

    // Done

    console.log('');
    console.log('> You are awesome!');
    console.log('');
};

start(config);