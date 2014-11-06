cinema.views.MetaDataSearchInformationToolbar = Backbone.View.extend({
    events: {
        'click .c-control-info': function () {
            cinema.events.trigger('c:infocontrols');
        }
    },

    initialize: function () {
        this._template = cinema.templates.metadataSearchInformationToolbar;
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