cinema.views.RenderingToolbar = Backbone.View.extend({
    events: {
        'click .c-edit-lookuptable': function () {
            cinema.events.trigger('c:editlookuptable');
        },

        'click .c-edit-lighting': function () {
            cinema.events.trigger('c:editlighting');
        },

        'click .c-view-fps-info': function () {
            cinema.events.trigger('c:viewfps');
        }
    },

    initialize: function (settings) {
        this.disabledList = settings.disabled;
    },

    render: function () {
        this.$el.html(cinema.templates.renderingToolbar({luts: []}));

        _.each(this.disabledList, function(elt, idx, l) {
            $('.' + elt).click();
            $('.' + elt).hide();
        });

        this.$('a[title]').tooltip({
            placement: 'bottom',
            delay: {show: 200}
        });
    }
});
