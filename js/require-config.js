require.config({
    baseUrl: "dist/js",
    paths: {
        "underscore": "lib/underscore-amd",
        "backbone": "lib/backbone-amd",
        "jquery" : "lib/jquery",
        "moment": "lib/moment",
        "spin": "lib/spin"
    },
    shim: {
        "lib/d3": {
            exports: "d3"
        },
        "lib/bootstrap": ["jquery"],
        "lib/Uri": {
            exports: "Uri"
        }
    }
});
