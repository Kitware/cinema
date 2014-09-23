cinema.views.ViewportImageBaseView = Backbone.View.extend({

    initialize: function (opts) {
        this.$el.html(cinema.app.templates.viewport());

        this.fields = opts.fields || new cinema.models.FieldModel({
            info: this.model
        });

        this.viewpoint = opts.viewpoint ||  new cinema.models.ViewPointModel({
            fields: this.fields
        });

        this.renderView = new cinema.views.StaticImageVisualizationCanvasWidget({
            el: this.$('.c-viewport-renderer-container'),
            model: this.model,
            fields: this.fields,
            viewpoint: this.viewpoint
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

        this.listenTo(this.fields, 'change', this._refreshFields);
        this.listenTo(cinema.events, 'c:resetCamera', this.renderView.resetCamera);
        this._refreshFields();
    },

    _refreshFields: function () {
        this.renderView.showViewpoint();
    }
});

// Register Composite view to the factory
cinema.viewFactory.registerView('parametric-image-stack', 'RenderView', function (that, visModel) {
    var fieldsModel = new cinema.models.FieldModel({
        info: that.visModel
    });

    var viewpointModel = new cinema.models.ViewPointModel({
        fields: fieldsModel
    });

    var viewportView = new cinema.views.ViewportImageBaseView({
        el: that.$('.c-rv-viewport-container'),
        model: that.visModel,
        fields: fieldsModel,
        viewpoint: viewpointModel
    });

    var fieldsControlWidget = new cinema.views.FieldsControlWidget({
        el: that.$('.c-rv-view-control-container'),
        model: that.visModel,
        viewport: viewportView,
        fields: fieldsModel,
        toolbarContainer: that.$('.c-rv-view-panel .c-panel-toolbar')
    });

    var renderChildren = function () {
        viewportView.render();
        fieldsControlWidget.render();
    };

    if (that.visModel.loaded()) {
        renderChildren();
    }

    that.listenTo(visModel, 'change', function () {
        renderChildren();
    });
}, [
    { position: 'right', key: 'view', icon: 'icon-camera', title: 'View' }
]);
