/*global module:true, require:true, jasmine: true*/
module.exports = function (grunt) {

    var taskConfig = {
        pkg: grunt.file.readJSON('package.json'),
        dirs: {
            tests: "tests/",
            src_js: "js/",
            src_css: "css/"
        },

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
                browser: true
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
                    '<%=dirs.src_js%>/**.js',
                    '!<%=dirs.src_js%>/lib/**.js'
                ]
            }
        },

        jasmine: {
            options: {
                specs: '<%=dirs.tests%>/**/*_spec.js',
                vendor: '<%=dirs.tests%>/vendor/jasmine-jquery.js',
                template: require('grunt-template-jasmine-requirejs'),
                templateOptions: {
                    requireConfig: {
                        baseUrl: 'js',
                        paths: {
                            'underscore': 'lib/underscore-amd',
                            'backbone': 'lib/backbone-amd',
                            'jquery': 'lib/jquery',
                            'moment': 'lib/moment'
                        },
                        shim: {
                            'lib/d3': {
                                exports: 'd3'
                            },
                            'lib/bootstrap': ['jquery']
                        },
                        callback: function($) {
                            // Set up the fixtures
                            jasmine.getFixtures().fixturesPath = 'tests/fixtures';
                        }
                    }
                }
            },
            app: {
                /* nothing new here */
            },
            debug: {
                options: {
                    /* save the runner file for debugging */
                    keepRunner: 'true'
                }
            }
        },

        watch: {
            options: {
                interrupt: true
            },
            gruntfile: {
                files: ['<%=jshint.gruntfile.src%>'],
                tasks: ['jshint:gruntfile', 'csslint', 'jshint:app', 'jasmine:app']
            },
            scripts: {
                files: ['<%=jshint.app.src%>', '<%=jasmine.options.specs%>'],
                tasks: ['jshint:app', 'jasmine:app']
            },
            styles: {
                files: ['<%=csslint.app.src%>'],
                tasks: ['csslint']
            }
        }
    };

    grunt.initConfig(taskConfig);


    // Load plugins here
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-csslint');

    grunt.loadNpmTasks('grunt-contrib-jasmine');

    // Define your tasks here
    grunt.registerTask('default', ['jshint', 'csslint', 'jasmine:app']);
};
