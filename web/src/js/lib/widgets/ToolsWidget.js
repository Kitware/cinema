/**
 * This widget provides controls for a VisualizationModel.
 * It emits an event anytime the value has changed, attaching data in the form
 * of a serialized query string.
 */
cinema.views.ToolsWidget = Backbone.View.extend({
    initialize: function (settings) {
        this.model = settings.model;
        this.viewport = settings.viewport;
        this.controlModel = settings.controlModel || new cinema.models.ControlModel({ info: this.model });
        this.toolbarSelector = settings.toolbarContainer || '.c-panel-toolbar';

        this.$('.c-control-panel-body').html(cinema.templates.toolsWidget());

        this.listenTo(cinema.events, 'c:editcontrols', this.toggleControlEditor);

        this.controlWidget = new cinema.views.ControlWidget({
            el: this.$('.c-control-content'),
            model: this.model,
            viewport: this.viewport,
            controlModel: this.controlModel,
            toolbarSelector: this.toolbarSelector,
            toolbarRootView: this,
            exclude: ['layer', 'field', 'filename']
        });
        this.render();
    },

    render: function () {
        this.$('.c-control-panel-body').html(cinema.templates.toolsWidget());
        this.controlWidget.setElement(this.$('.c-control-content')).render();
    },

    toggleControlEditor: function () {
        var link = this.$('.c-control-edit'),
            state;
        if (link.attr('state') === 'on') {
            state = 'off';
            link.attr('state', state);
            link.fadeOut();
        }
        else {
            state = 'on';
            link.attr('state', state);
            link.fadeIn();
        }
    }

});