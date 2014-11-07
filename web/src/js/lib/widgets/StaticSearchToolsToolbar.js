cinema.views.StaticSearchToolsToolbar = Backbone.View.extend({
    events: {
        'click .c-search-options-editor': function () {
            cinema.events.trigger('c:editsearchoptions');
        }
    },

    initialize: function () {
        this._template = cinema.templates.staticSearchToolsToolbar;
        this._templateOptions = {};
    },

    render: function () {
        this.$el.html(this._template(this._templateOptions));

        this.$('a[title]').tooltip({
            placement: 'bottom',
            delay: {show: 200}
        });
    }
});