cinema.views.HeaderView = Backbone.View.extend({
    events: {
        'click .c-show-pipeline-controls': function () {
            cinema.events.trigger('c:app.show-pipeline-controls');
        },
        'click .c-show-view-controls': function () {
            cinema.events.trigger('c:app.show-view-controls');
        },
        'click .c-search-button': function () {
            cinema.router.navigate('search', {trigger: true});
        },

        'click .c-view-button': function () {
            cinema.router.navigate('renderview', {trigger: true});
        }
    },

    render: function () {
        this.$el.html(cinema.app.templates.header());

        this.$('a[title]').tooltip({
            placement: 'auto',
            delay: {show: 200}
        });
    }
});
