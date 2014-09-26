cinema.views.RenderingControlToolbar = Backbone.View.extend({
    events: {
        'click .c-edit-lookuptable': function () {
            cinema.events.trigger('c:editlookuptable');
        },

        'click .c-edit-lighting': function () {
            cinema.events.trigger('c:editlighting');
        }
    },

    initialize: function () {
        this._template = cinema.templates.renderingControlToolbar;
        this.luts = ["rainbow", "greyscale", "red2blue", "citrus"];
    },

    render: function () {
        this.$el.html(this._template({
            luts: this.luts
        }));

        this.$('a[title]').tooltip({
            placement: 'bottom',
            delay: {show: 200}
        });
    }
});