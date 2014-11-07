(function () {
    var visibilityMap = { 'rendering': false, 'tools': false },
        leakCounter = 0;

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
            console.log('new ProbeView ' + (++leakCounter));
            this.controlModel = new cinema.decorators.Control(
                this.model
            );
            this.probeModel = new cinema.decorators.Probe(
                this.controlModel
            );
            this.renderingModel = new cinema.models.RenderingModel({
               url: '/rendering/rendering.json',
               ranges: this.probeModel.get('ranges'),
               fields: this.probeModel.get('fields')
           });
            this.renderer = new cinema.views.ProbeRendererWidget({
                model: this.probeModel,
                renderingModel: this.renderingModel
            });
            // this.controlView = new cinema.views.ControlWidget({
            //     model: this.probeModel,
            //     controlModel: this.probeModel
            // });
            // this.tools = new cinema.views.ProbeRendererControlWidget({
            //     model: this.probeModel,
            //     controlView: this.controlView
            // });
           //  this.renderingView = new cinema.views.RenderingWidget({
           //      el: this.$('.c-rendering-panel'),
           //      model: this.probeModel,
           //      viewport: this.renderer,
           //      renderingModel: this.renderingModel,
           //      toolbarSelector: '.c-panel-toolbar',
           //      disabledList: [ ] // 'c-edit-lighting', 'c-view-fps-info'
           //  });
        },

        render: function() {
            this.$el.html('hello');
            // this.renderer.setElement(this.$('.c-body-container')).render();
            // this.tools.setElement(this.$('.c-tools-panel')).render();
            // this.renderingView.setElement(this.$('.c-rendering-panel')).render();

            // this.$('.c-tools-panel').toggle(visibility('tools'));
            // this.$('.c-rendering-panel').toggle(visibility('rendering'));
        },

        remove: function() {
            console.log('new ProbeView ' + (--leakCounter));
            // // Trash views
            // this.renderer.remove();
            // this.controlView.remove();
            // this.tools.remove();
            // this.renderingView.remove();

            // // Trash models
            // this.controlModel.remove();
            // this.probeModel.remove();
            // this.renderingModel.remove();
        }
    });


    cinema.viewMapper.registerView('probe-slice', 'view', cinema.views.ProbeView, {
        controls: [
            // { position: 'left', key: 'rendering', icon: 'icon-picture', title: 'Rendering' },
            // { position: 'right', key: 'tools', icon: 'icon-tools', title: 'Tools' }
        ]
    });

}());
