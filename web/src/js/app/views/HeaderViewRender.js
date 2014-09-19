cinema.views.HeaderViewRender = cinema.views.HeaderView.extend({
    events: {
        'click .c-rh-pipeline-button': function () {
            cinema.events.trigger('c:app.show-pipeline-controls');
        },
        'click .c-rh-view-button': function () {
            cinema.events.trigger('c:app.show-view-controls');
        }
    },

    initialize: function () {
        this._template = cinema.app.templates.renderHeader;
    },

    render: function () {
        this.$el.html(this._template({
            controlPanels: cinema.viewFactory.getControls('RenderView')
        }));

        this.$('a[title]').tooltip({
            placement: 'auto',
            delay: {show: 200}
        });
    }
});
