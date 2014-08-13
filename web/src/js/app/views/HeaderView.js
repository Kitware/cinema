cinema.views.HeaderView = Backbone.View.extend({
    render: function () {
        this.$el.html(cinema.app.templates.header());

        this.$('a[title]').tooltip({
            placement: 'auto',
            delay: {show: 200}
        });
    }
});
