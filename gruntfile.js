/*global module:true, require:true, jasmine: true*/
module.exports = function (grunt) {

    var taskConfig = {
        pkg: grunt.file.readJSON('package.json'),
        dirs: {
            tests: {
                js: "tests/js",
                php: "tests/php"
            },
            src: "",
            src_js: "js/",
            src_css: "css/",
            src_img: "css/img/",
            dist: 'dist/',
            dist_js: 'dist/js/',
            dist_css: 'dist/css/',
            dist_img: 'dist/css/img'
        },

        clean: ["<%=dirs.dist%>"],

        csslint: {
            options: {
                'fallback-colors': 0,
                'box-sizing': 0,
                import: 0
            },
            app: {
                src: ['<%=dirs.src_css%>/**.css', '!<%=dirs.src_css%>/lib/**.css']
            }
        },

        // Configure the copy task to move files from the development to production folders
        copy: {
            dist: {
                files: [
                    {
                        expand: true,
                        cwd: '<%=dirs.src_img%>',
                        src: ['**/*'],
                        dest: '<%=dirs.dist_img%>/'
                    },
                    {
                        expand: true,
                        cwd: '<%=dirs.src%>',
                        src: ['data/**/*', 'elements/**/*', 'index.php', 'app.ini'],
                        dest: '<%=dirs.dist%>/'
                    }
                ]
            }
        },

        jshint: {

            // Some typical JSHint options and globals
            options: {
                curly: true,
                eqeqeq: true,
                immed: true,
                latedef: true,
                newcap: true,
                noarg: true,
                sub: true,
                undef: true,
                boss: true,
                eqnull: true,
                browser: true,
                expr: true,
                devel: true
            },

            gruntfile: {
                src: 'gruntfile.js'
            },

            app: {
                options: {
                    globals: {
                        browser: true,
                        define: true
                    }
                },
                src: [
                    '<%=dirs.src_js%>/**/*.js',
                    '!<%=dirs.src_js%>/lib/**/*.js'
                ]
            },

            tests: {
                options: {
                    globals: {
                        define: true,
                        jasmine: true,
                        it: true,
                        expect: true,
                        spyOn: true,
                        spyOnEvent: true,
                        loadFixtures: true,
                        beforeEach: true,
                        afterEach: true,
                        describe: true
                    }
                },
                src: [
                    '<%=dirs.tests.js%>/**/*.js',
                    '!<%=dirs.tests.js%>/vendor/**/*.js'
                ]
            }
        },

        jasmine: {
            options: {
                specs: '<%=dirs.tests.js%>/**/*_spec.js',
                vendor: '<%=dirs.tests.js%>/vendor/jasmine-jquery.js',
                template: require('grunt-template-jasmine-requirejs'),
                templateOptions: {
                    requireConfig: {
                        baseUrl: 'js',
                        paths: {
                            'underscore': 'lib/underscore-amd',
                            'backbone': 'lib/backbone-amd',
                            'jquery': 'lib/jquery',
                            'moment': 'lib/moment',
                            'spin': 'lib/spin'
                        },
                        shim: {
                            'lib/d3': {
                                exports: 'd3'
                            },
                            'lib/bootstrap': ['jquery'],
                            'lib/Uri': {
                                exports: 'Uri'
                            }
                        },
                        callback: function($) {
                            // Set up the fixtures
                            jasmine.getFixtures().fixturesPath = 'tests/js/fixtures';
                        }
                    }
                }
            },
            debug: {
                options: {
                    /* save the runner file for debugging */
                    keepRunner: 'true'
                }
            },
            app: {
                /* nothing new here */
            }
        },

        phplint: {
            app: {
                src: ['data/**/*.php', 'elements/**/*.php', 'templates/**/*.php', 'index.php']
            }
        },

        //This is sort-of like a regular requirejs config, but it is expanded
        //into valid configuration by a function below
        requirejs: {
            js: {
                options: {
                    baseUrl: "<%=dirs.src_js%>",
                    mainConfigFile: "<%=dirs.src_js%>/require-config.js",

                    //Compress the js files
                    optimize: "none",

                    //All the built layers will use almond.
                    name: 'lib/almond',

                    //Exclude jquery and the dummy config file
                    exclude: ['jquery']
                },
                modules: ['main']
            },
            css: {
                options: {
                    optimizeCss: 'standard'
                },
                modules: ['main']
            }
        },

        watch: {
            options: {
                interrupt: true
            },
            gruntfile: {
                files: ['<%=jshint.gruntfile.src%>'],
                tasks: ['jshint:gruntfile']
            },
            scripts: {
                files: ['<%=jshint.app.src%>', '<%=jasmine.options.specs%>'],
                tasks: ['jshint:app', 'jasmine:app']
            },
            styles: {
                files: ['<%=csslint.app.src%>'],
                tasks: ['csslint']
            },
            tests: {
                files: ['<%=jshint.tests.src%>'],
                tasks: ['jshint:tests', 'jasmine:app']
            },
            php: {
                files: ['<%=phplint.app.src%>'],
                tasks: ['phplint:app']
            }
        }
    };

    function buildRequireJSConfig() {
        var _ = require('underscore');

        var from = taskConfig.requirejs;
        var result = {};

        //Register the shorthand tasks
        _.each(from, function(config, key) {
            grunt.registerTask('build' + key, config.modules.map(function(name) {
                return 'requirejs:' + key + '-' + name;
            }));
        });

        //Go through the JS modules
        from.js.modules.forEach(function(name) {
            result['js-' + name] = {
                options: _.defaults({
                    include: [name],
                    out: '<%= dirs.dist_js %>/' + name + '.js'
                }, from.js.options)
            }
        });

        //Go through the CSS modules
        from.css.modules.forEach(function(name) {
            result['css-' + name] = {
                options: _.defaults({
                    cssIn: '<%=dirs.src_css%>/' + name + '.css',
                    out: '<%=dirs.dist_css%>/' + name + '.css'
                }, from.css.options)
            };
        });

        taskConfig.requirejs = result;
    }

    buildRequireJSConfig();

    grunt.initConfig(taskConfig);


    // Load plugins here
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-clean');

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-csslint');

    grunt.loadNpmTasks('grunt-contrib-jasmine');

    grunt.loadNpmTasks('grunt-contrib-requirejs');

    grunt.loadNpmTasks('grunt-phplint');

    // Define your tasks here
    grunt.registerTask('default', ['phplint', 'jshint', 'csslint', 'jasmine:app']);
    grunt.registerTask('build', ['clean', 'copy:dist', 'requirejs']);
};
