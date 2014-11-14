(function () {
    var visibilityMap = { 'rendering': false, 'tools': false },
        modelMap = {};

    function getDecoratedModel(model, container) {
        var key =  + '::' + ($(container).attr('container-uid') || 'main'),
            result = modelMap[key];
        if(!result) {
            var probeModel = new cinema.decorators.Probe(new cinema.decorators.Control(model)),
                renderingModel = new cinema.models.RenderingModel({
                    url: cinema.staticRoot + 'rendering/rendering.json',
                    ranges: probeModel.get('ranges'),
                    fields: probeModel.get('fields')
                });

            result = modelMap[key] = {
                key: key,
                probeModel: probeModel,
                renderingModel: renderingModel
            };
        }
        return result;
    }

    function freeDecoratedModel(key) {
        delete modelMap[key];
    }

    function visibility(name, value) {
        if(value === undefined) {
            return visibilityMap[name];
        } else {
            visibilityMap[name] = value;
        }
    }

    cinema.events.on('toggle-control-panel', function(event) {
        visibility(event.key, event.visible);
    });

    // --------- Add 'view' page for composite-image-stack dataset ----------

    cinema.views.ProbeView = Backbone.View.extend({
        initialize: function(opts) {
            // console.log('NEW: Probe view ' + (++instanceCount));

            this.key = getDecoratedModel(this.model, this.$el).key;
            this.probeModel = getDecoratedModel(this.model, this.$el).probeModel;
            this.renderingModel = getDecoratedModel(this.model, this.$el).renderingModel;

            this.renderer = new cinema.views.ProbeRendererWidget({
                model: this.probeModel,
                renderingModel: this.renderingModel
            });
            this.controlView = new cinema.views.ControlWidget({
                model: this.probeModel,
                controlModel: this.probeModel
            });
            this.tools = new cinema.views.ProbeRendererControlWidget({
                model: this.probeModel,
                controlView: this.controlView
            });
            this.renderingView = new cinema.views.RenderingWidget({
                el: this.$('.c-rendering-panel'),
                model: this.probeModel,
                viewport: this.renderer,
                renderingModel: this.renderingModel,
                toolbarSelector: '.c-panel-toolbar',
                disabledList: [ 'c-edit-lighting', 'c-view-fps-info' ]
            });
        },

        render: function() {
            this.renderer.setElement(this.$('.c-body-container')).render();
            this.tools.setElement(this.$('.c-tools-panel')).render();
            this.renderingView.setElement(this.$('.c-rendering-panel')).render();

            // If we do this, we can never interact with these panels in the
            // workbench.
            //this.$('.c-tools-panel').toggle(visibility('tools'));
            //this.$('.c-rendering-panel').toggle(visibility('rendering'));
        },

        remove: function() {
            // console.log('REMOVE: Probe view ' + --instanceCount);

            // Free factory
            freeDecoratedModel(this.key);

            this.key = null;

            // Trash views
            this.renderer.remove();
            this.controlView.remove();
            this.tools.remove();
            this.renderingView.remove();

            // Trash models
            this.probeModel.remove();
            this.renderingModel.remove();
        }
    });


    cinema.viewMapper.registerView('probe-slice', 'view', cinema.views.ProbeView, {
        controls: [
            { position: 'left', key: 'rendering', icon: 'icon-picture', title: 'Rendering' },
            { position: 'right', key: 'tools', icon: 'icon-tools', title: 'Tools' }
        ]
    });

}());
