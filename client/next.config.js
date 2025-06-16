module.exports = {
    webpack: (config, { isServer }) => {
        if (!isServer) {
            config.target = 'electron-renderer';
            
            // Add externals
            config.externals = {
                ...config.externals,
                electron: 'electron',
            };

            // Handle node modules
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                net: false,
                tls: false,
                dgram: false,
                'utf-8-validate': false,
                'bufferutil': false,
                'supports-color': false,
                child_process: false,
                dns: false,
                http: false,
                https: false,
                os: false,
                path: false,
                stream: false,
                crypto: false,
                randombytes: false,
                'parse-torrent': false,
                'simple-peer': false,
                'simple-get': false,
            };

            // Add resolve alias for webtorrent
            config.resolve.alias = {
                ...config.resolve.alias,
                'webtorrent': require.resolve('webtorrent'),
            };
        }
        return config;
    },
}; 