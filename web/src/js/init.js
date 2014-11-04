/**
 * This file is guaranteed to execute prior to the files under lib/, so any
 * code that should execute initially should be put into this file.
 */
"use strict";

if (!window.console) {
    var console = {
        log: function () {},
        error: function () {}
    };
}

var cinema = {
    models: {},
    viewType: null,
    collections: {},
    utilities: {},
    decorators: {},
    views: {},
    events: _.clone(Backbone.Events),
    router: new Backbone.Router(),
    searchQuery: null
};
