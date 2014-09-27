cinema.views.ViewControlToolbar = Backbone.View.extend({
    events: {
        'click .c-pipeline-editor': function () {
            cinema.events.trigger('c:editpipelines');
        },

        'click .c-controls-editor': function () {
            cinema.events.trigger('c:editcontrols');
        },

        'click .c-play-viewcontrol': function () {
        },

        'click .c-resize-viewcontrol': function () {
            cinema.events.trigger('c:resetCamera');
        }
    },

    initialize: function () {
        this._template = cinema.templates.viewControlToolbar;
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