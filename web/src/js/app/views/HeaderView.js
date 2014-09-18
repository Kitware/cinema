cinema.views.HeaderView = Backbone.View.extend({
    events: {
        'click .c-search-button': function () {
            cinema.router.navigate('search', {trigger: true});
        },

        'click .c-view-button': function () {
            cinema.router.navigate('renderview', {trigger: true});
        },

        'click .c-dashboard-button': function () {
            cinema.router.navigate('dashboard', {trigger: true});
        }
    },

    initialize: function () {
        this._template = cinema.app.templates.header;
        this._templateOptions = {};
    },

    render: function () {
        this.$el.html(this._template(this._templateOptions));

        this.$('a[title]').tooltip({
            placement: 'auto',
            delay: {show: 200}
        });
    }
});
