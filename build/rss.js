const fs     = require('fs');
const path   = require('path');
const {argv} = require('yargs');
const dotenv = require('dotenv');
const http   = require('http');
const https  = require('https');

// Prep env
const root = path.resolve('');
const env  = argv.mode || 'production';

dotenv.config({
    path: path.resolve('.env' + (env ? '.' + env : ''))
});

// Prep config
let config = require(path.resolve('rss.config.js'));

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

            cmd.get(config.dynamicMeta[i].url, (res) => {
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
    console.log('> Creating rss');
    console.log('  - generating xml');

    let date;
    let contents = "";
                
    contents += "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n";
    contents += "<rss version=\"2.0\">\n";
    contents += "<channel>\n";
    
    contents += "    <title>" + config.channel.title + "</title>\n";
    contents += "    <link>" + config.channel.url + "</link>\n";
    contents += "    <description>" + config.channel.description + "</description>\n";
    contents += "    <lastBuildDate>" + (new Date) + "</lastBuildDate>\n";
    contents += "    <language>" + (config.channel.language || 'en-us') + "</language>\n";

    contents += "\n";

    for (i = 0, ii = config.meta.length; i < ii; i++) {
        date = (config.meta[i].modified ? new Date(config.meta[i].modified) : new Date).toISOString();
        
        contents += "    <item>\n";
        contents += "        <title>" + config.meta[i].title + "</title>\n";
        contents += "        <link>" + config.meta[i].url + "</link>\n";
        contents += "        <guid>" + config.meta[i].guid + "</guid>\n";
        contents += "        <pubDate>" + date + "</pubDate>\n";
        
        if (config.meta[i].description) {
            contents += "        <description>[CDATA[" + config.meta[i].description + "]]</description>\n";
        }
        
        if (config.meta[i].image) {
            contents += "        <image>\n";
            contents += "            <url>" + config.meta[i].image + "</url>\n";
            contents += "        </image>\n";
        }

        contents += "    </item>\n";
    }

    contents += "</channel>";
    contents += "</rss>";

    console.log('  - writing ' + config.outputDir + '/rss.xml');

    await new Promise((resolve) => {
        fs.writeFile(config.outputDir + '/rss.xml', contents, () => {
            resolve();
        });
    });

    // Done

    console.log('');
    console.log('> You are awesome!');
    console.log('');
};

start(config);