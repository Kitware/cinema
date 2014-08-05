cinema.StandaloneApp = Backbone.View.extend({
    initialize: function () {
        this.render();

        // Initialize the routing system
        Backbone.history.start({
            pushState: false
        });
    },

    render: function () {
        // Render the layout
        this.$el.html(cinema.app.templates.layout());
    }
});
