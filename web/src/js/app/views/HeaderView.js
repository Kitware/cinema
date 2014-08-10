cinema.views.HeaderView = Backbone.View.extend({
    render: function () {
        this.$el.html(cinema.app.templates.header());
    }
});
