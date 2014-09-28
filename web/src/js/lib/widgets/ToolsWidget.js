/**
 * This widget provides controls for a VisualizationModel.
 * It emits an event anytime the value has changed, attaching data in the form
 * of a serialized query string.
 */
cinema.views.ToolsWidget = Backbone.View.extend({
    initialize: function (settings) {
        this.model = settings.model;
        this.viewport = settings.viewport;
        this.fields = settings.fields || new cinema.models.FieldModel({ info: this.model });
        this.toolbarSelector = settings.toolbarContainer || '.c-panel-toolbar';

        this.$('.c-control-panel-body').html(cinema.templates.toolsWidget());

        this.listenTo(cinema.events, 'c:editcontrols', this.hideControlEditor);

        this.controls = new cinema.views.FieldsControlWidget({
            el: this.$('.c-control-content'),
            model: this.model,
            viewport: this.viewport,
            fields: this.fields,
            toolbarSelector: this.toolbarSelector,
            toolbarRootView: this,
            exclude: ['layer', 'field', 'filename']
        });
        this.render();
    },

    render: function () {
        this.$('.c-control-panel-body').html(cinema.templates.toolsWidget());
        this.controls.setElement(this.$('.c-control-content')).render();
    },

    hideControlEditor: function () {
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
    },

});