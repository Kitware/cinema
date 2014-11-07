cinema.views.StaticSearchToolsWidget = Backbone.View.extend({
    initialize: function (settings) {
        this.model = settings.model;
        this.toolbarSelector = settings.toolbarContainer || '.c-panel-toolbar';

        this.$('.c-control-panel-body').html(cinema.templates.searchToolsWidget());

        this.listenTo(cinema.events, 'c:editsearchoptions', this.toggleSearchOptionsEditor);

        this.searchOptionsWidget = new cinema.views.StaticSearchOptionsWidget({
            el: this.$('.c-search-options-content'),
            toolbarSelector: this.toolbarSelector,
            toolbarRootView: this
        });
        this.render();
    },

    render: function () {
        this.$('.c-control-panel-body').html(cinema.templates.searchToolsWidget());
        this.searchOptionsWidget.setElement(this.$('.c-search-options-content')).render();
    },

    toggleSearchOptionsEditor: function () {
        this.$('.c-search-options-edit').fadeToggle();
    }
});
