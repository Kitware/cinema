cinema.views.SearchInformationToolbar = Backbone.View.extend({
    events: {

    },

    initialize: function () {
        this._template = cinema.templates.searchInformationToolbar;
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