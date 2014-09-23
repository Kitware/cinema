cinema.views.ViewportDynamicRenderingCompositeView = Backbone.View.extend({

    initialize: function (opts) {
        this.$el.html(cinema.app.templates.viewport());

        this.fields = opts.fields || new cinema.models.FieldModel({
            info: this.model
        });

        this.viewpoint = opts.viewpoint ||  new cinema.models.ViewPointModel({
            fields: this.fields
        });

        this.layers = opts.layers || new cinema.models.LayerModel(
            this.model.getDefaultPipelineSetup()
        );

        this.renderView = new cinema.views.VisualizationCanvasWidgetLit({
            el: this.$('.c-viewport-renderer-container'),
            model: this.model,
            fields: this.fields,
            viewpoint: this.viewpoint,
            layers: this.layers
        }).render();

        this.mouseInteractor = new cinema.utilities.RenderViewMouseInteractor({
            renderView: this.renderView,
            camera: this.viewpoint
        }).enableMouseWheelZoom({
            maxZoomLevel: 10,
            zoomIncrement: 0.05,
            invertControl: false
        }).enableDragPan({
            keyModifiers: cinema.keyModifiers.SHIFT
        }).enableDragRotation({
            keyModifiers: null
        });

        this.listenTo(this.fields, 'change', this._refreshCamera);
        this.listenTo(this.viewpoint, 'change', this._refreshCamera);
        this.listenTo(cinema.events, 'c:resetCamera', this.renderView.resetCamera);
    },

    _refreshCamera: function () {
        this.renderView.showViewpoint();
    },

    /*
    render: function() {
        this.$el.html("<center>My super lighting dynamic view goes here!!!</center>");
    },
    */

    updateLight: function (vectorLight) {
        this.renderView.setLight(vectorLight);
        this.renderView.forceRedraw();
    },

    updateTransfertFunction: function (func) {
        this.renderView.setLUT(func);
        this.renderView.forceRedraw();
    },

    updateLightColor: function (lightColor) {
        this.renderView.setLightColor(lightColor);
        this.renderView.forceRedraw();
    },

    updateLightTerms: function (terms) {
        this.renderView.setLightTerms(terms);
        this.renderView.forceRedraw();
    }
});

// Register Composite view to the factory
cinema.viewFactory.registerView('composite-image-stack-light', 'RenderView', function (that, visModel) {
     var compositeModel = new cinema.decorators.Composite(that.visModel);

    var fieldsModel = new cinema.models.FieldModel({
        info: compositeModel
    });

    var viewpointModel = new cinema.models.ViewPointModel({
        fields: fieldsModel
    });

    var layers = new cinema.models.LayerModel(compositeModel.getDefaultPipelineSetup());

    var viewportView = new cinema.views.ViewportDynamicRenderingCompositeView({
        el: that.$('.c-rv-viewport-container'),
        model: compositeModel,
        layers: layers,
        fields: fieldsModel,
        viewpoint: viewpointModel
    });

    var compositePipeline = new cinema.views.CompositePipelineWidget({
        el: that.$('.c-rv-tools-panel'),
        model: compositeModel,
        fields: fieldsModel,
        viewpoint: viewpointModel,
        layers: layers,
        toolbarSelector: '.c-panel-toolbar'
    });

    var colorTransformationView = new cinema.views.ColorTransformationWidget({
        el: that.$('.c-rv-colorTransform-control-container'),
        model: compositeModel,
        viewport: viewportView
    });


    var renderChildren = function () {
        viewportView.render();
        compositePipeline.render();
        colorTransformationView.render();
    };

    if (that.visModel.loaded()) {
        renderChildren();
    }

    that.listenTo(visModel, 'change', function () {
        renderChildren();
    });
}, [
    { position: 'right', key: 'tools',     icon: 'icon-tools', title: 'Tools' },
    { position: 'left',  key: 'colorTransform', icon: 'icon-tint',   title: 'Color Transformation'}
]);
