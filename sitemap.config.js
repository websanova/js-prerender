const path = require('path');

module.exports = {
    outputDir: path.resolve('dist'),

    meta: require(path.resolve('src/app/router/meta.js')),

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
                        title: 'Websanova - ' + item.title,
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