(function () {
    /**
     * The RenderViewInteractor is used to bind interactor functionality onto
     * an underlying render view that fires primitive mouse events.
     * The enable* methods of this class are idempotent, but can be used to
     * adjust the parameters of interaction at runtime.
     */
    cinema.utilities.RenderViewMouseInteractor = function (params) {
        this.renderView = params.renderView;

        return _.extend(this, Backbone.Events);
    };

    var prototype = cinema.utilities.RenderViewMouseInteractor.prototype;

    /**
     * Add mouse wheel zooming controls onto this interactor's render view.
     * This method is
     */
    prototype.enableMouseWheelZoom = function (params) {
        params = params || {};
        this._maxZoomLevel = params.maxZoomLevel || 10;
        this._wheelZoomIncrement = params.zoomIncrement || 0.05;
        this._wheelZoomInversion = params.invertControl || false;

        if (this._mouseWheelZoom) {
            return this;
        }

        this._mouseWheelZoom = true;
        this.renderView.on('c:mousewheel', function (evt) {
            evt.preventDefault();

            var x = evt.originalEvent.wheelDeltaY || evt.originalEvent.detail,
                zoomInc = x > 0 ? this._wheelZoomIncrement : -this._wheelZoomIncrement;

            if (this._wheelZoomInversion) {
                zoomInc = -zoomInc;
            }

            if (this.renderView.zoomLevel + zoomInc <= this._maxZoomLevel) {
                this.renderView.zoomLevel = this.renderView.zoomLevel + zoomInc;
                this.renderView.drawImage();
            }
        }, this);

        return this;
    };
}) ();
