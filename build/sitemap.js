const fs     = require('fs');
const path   = require('path');
const {argv} = require('yargs');
const dotenv = require('dotenv');
const http   = require('http');
const https  = require('https');

// Config
const env        = argv.mode || 'production';
const configPath = argv.config || 'sitemap.config.js';

dotenv.config({
    path: path.resolve('.env' + (env ? '.' + env : ''))
});

let config = require(path.resolve(configPath));

// 
async function start(config) {
    
    // Fetch Dynamic Meta

    let i, ii;

    config.meta = config.meta || [];
    config.dynamicMeta = config.dynamicMeta || [];

    console.log('> Fetching dynamic meta');

    for (i = 0, ii = config.dynamicMeta.length; i < ii; i++) {
        config.dynamicMeta[i].protocol = config.dynamicMeta[i].url.substring(0, 5) === 'https' ? 'https': 'http';

        await new Promise((resolve) => {
            let cmd = config.dynamicMeta[i].protocol === 'http' ? http : https;
            
            console.log( '  - ' + config.dynamicMeta[i].url);

            cmd.get(config.dynamicMeta[i].url, {
                rejectUnauthorized: false
            }, (res) => {
                let data = '';

                res.on('data', (chunk) => { data += chunk; });

                res.on('end', () => {
                    let res = JSON.parse(data);
                    let meta = config.dynamicMeta[i].cb(res);

                    config.meta = config.meta.concat(meta);

                    resolve();
                });
            });
        });
    }

    //

    console.log('');
    console.log('> Creating sitemap');
    console.log('  - generating xml');

    let date;
    let contents = "";
    let outputFile = path.resolve(config.outputFile || 'dist/sitemap.xml');

    contents += "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n";
    contents += "<urlset\n";
    contents += "    xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\"\n";
    contents += "    xmlns:image=\"http://www.google.com/schemas/sitemap-image/1.1\"\n";
    contents += "    xmlns:video=\"http://www.google.com/schemas/sitemap-video/1.1\"\n";
    contents += ">\n";

    for (i = 0, ii = config.meta.length; i < ii; i++) {
        date = (config.meta[i].modified ? new Date(config.meta[i].modified) : new Date).toISOString();

        contents += "    <url>\n";
        contents += "        <loc>" + config.meta[i].url + "</loc>\n";
        
        if (config.meta[i].image) {
            contents += "        <image:image>\n";
            contents += "            <image:loc>" + config.meta[i].image + "</image:loc>\n";
            contents += "        </image:image>\n";
        }
        
        contents += "        <lastmod>" + date + "</lastmod>\n";
        contents += "        <changefreq>" + (config.meta[i].freq || 'daily') + "</changefreq>\n";
        contents += "        <priority>" + (config.meta[i].priority || '1.0') + "</priority>\n";
        contents += "    </url>\n";
    }

    contents += "</urlset>";

    console.log('  - writing ' + outputFile);

    await new Promise((resolve) => {
        fs.writeFile(outputFile, contents, () => {
            resolve();
        });
    });

    // Done

    console.log('');
    console.log('> Happy happy, joy joy!');
    console.log('');
};

start(config);