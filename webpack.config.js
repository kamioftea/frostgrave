module.exports = {
    module: {
        loaders: [
            {
                test:    /.jsx?$/,
                loader:  'babel-loader',
                query:   {
                    presets: ['es2015', 'react'],
                    plugins: ["transform-object-rest-spread"]
                }
            },
        ]
    }
};
