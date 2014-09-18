cinema.views.HeaderViewRender = cinema.views.HeaderView.extend({
    events: {
        'click .c-show-pipeline-controls': function () {
            cinema.events.trigger('c:app.show-pipeline-controls');
        },
        'click .c-show-view-controls': function () {
            cinema.events.trigger('c:app.show-view-controls');
        }
    },

    initialize: function () {
        this._template = cinema.app.templates.renderHeader;
        this._templateOptions = {};
    }
});
