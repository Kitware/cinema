cinema.views.CompositeHistogramToolbar = Backbone.View.extend({
    events: {
        'click .c-edit-histogram': function () {
            cinema.events.trigger('c:edithistogram');
        },
        'click .c-show-histogram-legend': function () {
            cinema.events.trigger('c:showhistogramlegend');
        }
    },

    initialize: function () {
        this._template = cinema.templates.compositeHistogramToolbar;
    },

    render: function () {
        this.$el.html(this._template({
        }));

        this.$('a[title]').tooltip({
            placement: 'bottom',
            delay: {show: 200}
        });
    }
});
