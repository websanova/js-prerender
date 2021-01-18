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

// Config
const env        = argv.mode || 'production';
const configPath = argv.config || 'prerender.config.js';

dotenv.config({
    path: path.resolve('.env' + (env ? '.' + env : ''))
});

// Config presets
let config      = require(path.resolve(configPath));
let Renderer    = PrerenderSPAPlugin.PuppeteerRenderer;
let postProcess = config.postProcess;

config.staticDir = path.resolve(config.staticDir || 'dist');
config.outputDir = path.resolve(config.outputDir || 'prerender');
config.copyDir   = config.copyDir || ['css', 'img'];

config.minify = Object.assign({
    collapseWhitespace: true
}, config.minify || {});

config.renderer =  new Renderer(Object.assign({
    headless: true,
    renderAfterTime: 5000,
    maxConcurrentRoutes: 10,
    // renderAfterElementExists: 'page-loaded'
    // renderAfterDocumentEvent: 'prender-trigger',
}, config.renderer || {}));


config.postProcess = function(renderedRoute) {

    // Remove all js links.
    renderedRoute.html = renderedRoute.html.replace(/\/js\/.*?\.js/g, '');

    // Run anything else from config.
    if (postProcess) {
        renderedRoute = postProcess(renderedRoute);
    }

    return renderedRoute;
};

//
async function start(config) {
    
    // Create temp index required for webpack.
    
    let indexPath = path.resolve('index-prerender-temp.js');

    await new Promise((resolve) => {
        fs.writeFile(indexPath, '', () => {
            resolve();
        });
    });

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

            cmd.get(config.dynamicRoutes[i].url, {
                rejectUnauthorized: false
            }, (res) => {
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

    await new Promise((resolve) => {
        fs.unlink(indexPath, () => {
            resolve();
        });
    });

    // Reset css directory.

    console.log('');
    console.log('> Copy directories');

    for (i = 0, ii = config.copyDir.length; i < ii; i++) {
        console.log('  - ' + config.staticDir + '/' + config.copyDir[i]);

        await exec('rm -rf ' + config.outputDir + '/' + config.copyDir[i]);
        
        await exec(
            'rsync -av --ignore-missing-args ' +
            config.staticDir + '/' + config.copyDir[i] + ' ' +
            config.outputDir
        );
    }

    // Done

    console.log('');
    console.log('> Happy happy, joy joy!');
    console.log('');
};

start(config);