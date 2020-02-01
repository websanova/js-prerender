const path = require('path');

module.exports = {
    outputDir: path.resolve('dist'),

    channel: {
        title: 'Websanova',
        url: process.env.VUE_APP_APP_URL,
        description: 'Websanova Starter Kit Blog'
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
                        title: 'Websanova - ' + item.title,
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