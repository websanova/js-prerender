const path               = require('path');
const PrerenderSPAPlugin = require('prerender-spa-plugin');

let Renderer = PrerenderSPAPlugin.PuppeteerRenderer;

module.exports = {
    staticDir: path.resolve('dist'),
    
    outputDir: path.resolve('prerender'),

    minify: {
        collapseWhitespace: true
    },

    renderer: new Renderer({
        headless: true,
        
        maxConcurrentRoutes: 10,

        renderAfterTime: 5000
    }),

    routes: [
        '/',
        '/help',
        '/plans',
        '/login',
        '/contact',
        '/register',
        '/privacy-policy',
        '/terms-of-service',
        '/password/change',
        '/articles/1/list',
        '/articles/2/list',
        '/articles/3/list',
        '/articles/4/list',
        '/articles/5/list'
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
    }],

    postProcess(renderedRoute) {

        // Remove all js links.
        renderedRoute.html = renderedRoute.html.replace(/\/js\/.*?\.js/g, '');
        
        return renderedRoute;
    }
};