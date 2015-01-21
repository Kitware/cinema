cinema.views.ToolsToolbar = Backbone.View.extend({
    events: {
        'click .c-controls-editor': function () {
            cinema.events.trigger('c:editcontrols');
        },

        'click .c-resize-tools': function () {
            cinema.events.trigger('c:resetCamera');
        }
    },

    initialize: function () {
        this._template = cinema.templates.toolsToolbar;
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