# prerender

Build files for spa prerender.


## Sponsor

If you like this plugin please consider sponsoring.

* [GitHub](https://github.com/sponsors/websanova)
* [Patreon](https://patreon.com/websanova)


## Disclaimer

Please note that this package has only been tested with Vue deployments and has mainly only been used in personal projects.

It should however work for any SPA (JavaScript) project as we are just rendering routes. However, there may be issues with other frameworks and setups.


## Install

To start a few dependencies will need to be included.

Pretty much any version of `webpack` > 4 and `webpack-cli` > 3 should be fine.


```json
{
    "scripts": {
        "prerender": "node ./node_modules/@websanova/js-prerender/build/prerender",
        "sitemap": "node ./node_modules/@websanova/js-prerender/build/sitemap",
        "rss": "node ./node_modules/@websanova/js-prerender/build/rss"
    },
    "devDependencies": {
        "@websanova/js-prerender": "0.1.0",
        "prerender-spa-plugin": "3.4.0",
        "webpack": "5.15.0",
        "webpack-cli": "4.3.1"
    }
}
```

Next, setup a config file for each build with an empty `module.exports = {}`;

```shell
./rss.config.js
./sitemap.config.js
./prerender.config.js
```

After that the builds should run.

```shell
> npm run rss
> npm run sitemap
> npm run prerender
```

There are also optional `--mode` and `--config` flags available.

```shell
> npm run rss -- --mode=local
> npm run sitemap -- --config=/path/to/config.js
> npm run prerender -- --mode=local --config=/path/to/config.js
```


## RSS

General setup for the rss.

```js
module.exports = {

    // Optional (defaults shown).

    outputFile: 'dist/rss.xml',

    // Should include

    channel: {
        title: 'AppName',
        url: process.env.VUE_APP_APP_URL,
        description: 'AppName Blog'
    },

    meta: [],

    dynamicMeta: [{
        url: process.env.VUE_APP_API_URL + '/articles/published?limit=500',
        cb: (res) => {
            let i, ii;
            let meta = [];

            for (i = 0, ii = res.data.items.length; i < ii; i++) {
                (function () {
                    var item = res.data.items[i];

                    meta.push({
                        url: process.env.VUE_APP_APP_URL + '/articles/' + item.slug,
                        title: 'AppName - ' + item.title,
                        keywords: item.keywords || item.title.toLowerCase().split(' ').join(', '),
                        description: item.body_short,
                        image: item.image,
                        published: item.release_at,
                        guid: item.guid
                    });
                })(i);
            }

            return meta;
        }
    }]
};
```


## Sitemap

General setup for the sitemap.

```js
module.exports = {

    // Optional (defaults shown).

    outputFile: 'dist/sitemap.xml',

    // Should include

    meta: [{
        url: process.env.VUE_APP_APP_URL + '/',
        image: process.env.VUE_APP_APP_URL + '/img/logo/logo-400x400.png',
    }, {
        url: process.env.VUE_APP_APP_URL + '/login',
        image: process.env.VUE_APP_APP_URL + '/img/logo/logo-400x400.png'
    }, {
        url: process.env.VUE_APP_APP_URL + '/register',
        image: process.env.VUE_APP_APP_URL + '/img/logo/logo-400x400.png'
    }],

    dynamicMeta: [{
        url: process.env.VUE_APP_API_URL + '/articles/published?limit=500',
        cb: (res) => {
            let i, ii;
            let meta = [];

            for (i = 0, ii = res.data.items.length; i < ii; i++) {
                (function () {
                    var item = res.data.items[i];

                    meta.push({
                        url: process.env.VUE_APP_APP_URL + '/articles/' + item.slug,
                        type: 'article',
                        title: 'AppName - ' + item.title,
                        keywords: item.keywords || item.title.toLowerCase().split(' ').join(', '),
                        description: item.body_short,
                        image: item.image,
                        modified: item.updated_at
                    });
                })(i);
            }

            return meta;
        }
    }]
};
```


## Prerender

General setup for the prerender.

```js
module.exports = {

    // Optional (defaults shown).

    staticDir: 'dist',

    outputDir: 'prerender',

    copyDir: ['css', 'img'],

    minify: {
        collapseWhitespace: true
    },

    renderer: {
        headless: true,
        renderAfterTime: 5000,
        maxConcurrentRoutes: 10
    },

    postProcess: function (renderedRoute) {
        renderedRoute.html = renderedRoute.html.replace(/\/js\/.*?\.js/g, '');

        if (postProcess) {
            renderedRoute = postProcess(renderedRoute);
        }

        return renderedRoute
    },

    // Should include

    routes: [
        '/',
        '/login',
        '/register',
        '/articles/1/list',
        '/articles/2/list',
        '/articles/3/list',
        '/articles/4/list',
        '/articles/5/list',
        '/articles/6/list',
        '/articles/7/list',
        '/articles/8/list',
        '/articles/9/list',
        '/articles/10/list'
    ],

    dynamicRoutes: [{
        url: process.env.VUE_APP_API_URL + '/articles/published?limit=500',
        cb: (res) => {
            let i, ii;
            let routes = [];

            for (i = 0, ii = res.data.items.length; i < ii; i++) {
                (function () {
                    routes.push('/articles/' + res.data.items[i].slug);
                })(i);
            }

            return routes;
        }
    }]
};
```


## License

MIT licensed

Copyright (C) 2011-2020 Websanova http://www.websanova.com