/*global module:true, require:true, jasmine: true*/
module.exports = function (grunt) {

    var taskConfig = {
        pkg: grunt.file.readJSON('package.json'),
        dirs: {
            tests: {
                js: "tests/js",
                php: "tests/php"
            },
            src: {
                base: '',
                js: "static/js/",
                css: "static/css/",
                img: "static/img/",
                views: "views/",
                util: "util/",
                templates: "templates/"
            },
            dist: {
                base: 'dist/',
                templates: 'dist/templates/',
                static: 'dist/static',
                js: 'dist/static/js/',
                css: 'dist/static/css/',
                img: 'dist/static/img/'
            }
        },

        clean: ["<%=dirs.dist.base%>"],

        lesslint: {
            options: {
                csslint: {
                    'fallback-colors': false,
                    'overqualified-elements': false,
                    'empty-rules': false,
                    'box-model': false,
                    'known-properties': false,
                    'adjoining-classes': false
                }
            },
            app: {
                src: ['<%=dirs.src.css%>/**.less', '!<%=dirs.src.css%>/lib/**.less']
            }
        },

        less: {
            app: {
                options: {
                },
                files: [
                    {
                        cwd: '<%=dirs.src.css%>',
                        expand: true,
                        src: ['**/*.less', '!lib/mixins.less'],
                        dest: '<%=dirs.src.css%>',
                        ext: '.css'
                    }
                ]
            }
        },

        // Configure the copy task to move files from the development to production folders
        copy: {
            dist: {
                files: [
                    {
                        expand: true,
                        cwd: '<%=dirs.src.img%>',
                        src: ['**/*'],
                        dest: '<%=dirs.dist.img%>/'
                    },
                    {
                        expand: true,
                        cwd: '<%=dirs.src.base%>',
                        src: ['<%=dirs.src.views%>/**/*', '<%=dirs.src.util%>/**/*', '<%=dirs.src.templates%>/**/*', 'index.php'],
                        dest: '<%=dirs.dist.base%>/'
                    }
                ]
            },
            dist_ini: {
                cwd: '<%=dirs.src.base%>',
                src: 'app.ini',
                dest: '<%=dirs.dist.base%>/app.ini',
                options: {
                    mode: '0640',
                    process: function (content, srcpath) {
                        return content.replace(/environment=development/g,"environment=production");
                    }
                }
            }
        },

        ver: {
            dist: {
                phases: [
                    {
                        files: [
                            '<%=dirs.dist.img%>/**/*'
                        ],
                        references: [
                            '<%=dirs.dist.css%>/**/*.css'
                        ]
                    },
                    {
                        files: [
                            '<%=dirs.dist.css%>/**/*.css',
                            '<%=dirs.dist.js%>/**/*.js'
                        ]
                    }
                ],
                baseDir: '<%=dirs.dist.static%>',
                versionFile: '<%=dirs.dist.base%>/staticfiles.json'
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
                    '<%=dirs.src.js%>/**/*.js',
                    '!<%=dirs.src.js%>/lib/**/*.js'
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
                        baseUrl: 'static/js',
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

        phpunit: {
            classes: {
                dir: 'tests/php/'
            },
            options: {
                bootstrap: 'tests/php/phpunit.php',
                colors: true
            }
        },

        phplint: {
            app: {
                src: ['<%=dirs.src.views%>/**/*.php', '<%=dirs.src.util%>/**/*.php', '<%=dirs.src.templates%>/**/*.php', '<%=dirs.src.base%>*.php']
            }
        },

        //This is sort-of like a regular requirejs config, but it is expanded
        //into valid configuration by a function below
        requirejs: {
            js: {
                options: {
                    baseUrl: "<%=dirs.src.js%>",
                    mainConfigFile: "<%=dirs.src.js%>/require-config.js",

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
                files: ['<%=lesslint.app.src%>'],
                tasks: ['lesslint', 'less']
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
                    out: '<%= dirs.dist.js %>/' + name + '.js'
                }, from.js.options)
            };
        });

        //Go through the CSS modules
        from.css.modules.forEach(function(name) {
            result['css-' + name] = {
                options: _.defaults({
                    cssIn: '<%=dirs.src.css%>/' + name + '.css',
                    out: '<%=dirs.dist.css%>/' + name + '.css'
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
    grunt.loadNpmTasks('grunt-lesslint');

    grunt.loadNpmTasks('grunt-contrib-jasmine');
    grunt.loadNpmTasks('grunt-phpunit');

    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-requirejs');

    grunt.loadNpmTasks('grunt-phplint');

    grunt.loadNpmTasks('grunt-ver');

    // Define your tasks here
    grunt.registerTask('default', ['phplint', 'jshint', 'lesslint', 'jasmine:app', 'phpunit']);
    grunt.registerTask('build', ['clean', 'copy:dist', 'copy:dist_ini', 'requirejs', 'ver:dist']);
};
