/**
 * Copyright Kitware Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

module.exports = function (grunt) {
    var staticRoot;
    var fs = require('fs');
    var jade = require('jade');
    var path = require('path');

    // Pass a "--env=<value>" argument to grunt. Default value is "dev".
    var environment = grunt.option('env') || 'dev';
    if (['dev', 'prod'].indexOf(environment) === -1) {
        grunt.fatal('The --env argument must be either "dev" or "prod".');
    }

    // Project configuration.
    grunt.config.init({
        pkg: grunt.file.readJSON('package.json'),

        extend: {
            options: {
                defaults: {
                    staticRoot: '/'
                }
            },
            config: {
                files: {
                    'config.json': ['config.json']
                }
            }
        },

        jade: {
            options: {
                client: true,
                compileDebug: false,
                namespace: 'cinema.templates',
                processName: function (filename) {
                    return path.basename(filename, '.jade');
                }
            },
            core: {
                files: {
                    'web/dist/templates.js': [
                        'web/src/templates/**/*.jade'
                    ]
                }
            }
        },

        stylus: {
            core: {
                files: {
                    'web/dist/app.min.css': [
                        'web/src/stylesheets/**/*.styl'
                    ]
                }
            }
        },

        uglify: {
            options: {
                sourceMap: environment === 'dev',
                sourceMapIncludeSources: true,
                report: 'min',
                beautify: {
                    ascii_only: true
                }
            },
            app: {
                files: {
                    'web/dist/app.min.js': [
                        'web/dist/templates.js',
                        'web/src/models/**/*.js',
                        'web/src/collections/**/*.js',
                        'web/src/views/**/*.js'
                    ],
                    'web/dist/main.min.js': [
                        'web/src/main.js'
                    ]
                }
            },
            libs: {
                files: {
                    'web/dist/libs.min.js': [
                        'node_modules/jquery-browser/lib/jquery.js',
                        'node_modules/jade/runtime.js',
                        'node_modules/underscore/underscore.js',
                        'node_modules/backbone/backbone.js'
                    ]
                }
            }
        },

        watch: {
            stylus_core: {
                files: ['web/src/stylesheets/**/*.styl'],
                tasks: ['stylus:core'],
                options: {failOnError: false}
            },
            js_core: {
                files: ['web/src/**/*.js'],
                tasks: ['uglify:app'],
                options: {failOnError: false}
            },
            jade_core: {
                files: ['web/src/templates/**/*.jade'],
                tasks: ['build-app'],
                options: {failOnError: false}
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-jade');
    grunt.loadNpmTasks('grunt-contrib-stylus');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-extend');

    grunt.registerTask('index-html', 'Build the index.html page.', function () {
        var buffer = fs.readFileSync('web/src/index.html.jade');
        var config = grunt.file.readJSON('config.json');

        var fn = jade.compile(buffer, {
            client: false,
            pretty: true
        });
        fs.writeFileSync('web/dist/index.html', fn({
            cssFiles: [
                'app.min.css'
            ],
            jsFiles: [
                'libs.min.js',
                'app.min.js'
            ],
            config: config
        }));
    });

    grunt.registerTask('build-app', ['jade', 'uglify:app', 'index-html']);
    grunt.registerTask('init', ['extend', 'uglify:libs']);
    grunt.registerTask('default', ['stylus', 'build-app']);
};
