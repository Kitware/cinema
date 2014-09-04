(function () {
    /**
     * The RenderViewInteractor is used to bind interactor functionality onto
     * an underlying render view that fires primitive mouse events.
     * The enable* methods of this class are idempotent, but can be used to
     * adjust the parameters of interaction at runtime.
     */
    cinema.utilities.RenderViewMouseInteractor = function (params) {
        this.renderView = params.renderView;
        this.visModel = params.visModel || params.renderView.visModel;

        return _.extend(this, Backbone.Events);
    };

    var prototype = cinema.utilities.RenderViewMouseInteractor.prototype;

    /**
     * Add mouse wheel zooming controls onto this interactor's render view.
     * @param maxZoomLevel The maximum magnification to allow for this interactor.
     * @param minZoomLevel The minimum magnification to allow for this interactor.
     * @param zoomIncrement The change in magnification per mouse wheel tick.
     * @param invertControl Whether to invert the up/down controls of the mouse wheel.
     */
    prototype.enableMouseWheelZoom = function (params) {
        params = params || {};
        this._maxZoomLevel = params.maxZoomLevel || 10;
        this._minZoomLevel = params.minZoomLevel || 1 / this._maxZoomLevel;
        this._wheelZoomIncrement = params.zoomIncrement || 0.05;
        this._wheelZoomInversion = params.invertControl || false;

        this.renderView.off('c:mousewheel', null, this).on('c:mousewheel', function (evt) {
            evt.preventDefault();

            var x = evt.originalEvent.wheelDeltaY || evt.originalEvent.detail,
                zoomInc = x > 0 ? this._wheelZoomIncrement : -this._wheelZoomIncrement;

            if (this._wheelZoomInversion) {
                zoomInc = -zoomInc;
            }

            var newZoom = this.renderView.zoomLevel + zoomInc;
            if (newZoom <= this._maxZoomLevel && newZoom >= this._minZoomLevel) {
                this.renderView.zoomLevel = newZoom;
                this.renderView.drawImage();
            }
        }, this);

        return this;
    };

    /**
     * For interactivity that requires drag, make sure this gets called.
     */
    prototype._measureDrag = function () {
        if (this._measuringDrag) {
            return this;
        }
        this._dragStart = null;
        this._measuringDrag = true;
        this.renderView.on('c:mousedown', function (evt) {
            this._dragStart = [evt.pageX, evt.pageY];
        }, this);

        this.renderView.on('c:mouseup', function () {
            this._dragStart = null;
        }, this);

        this.renderView.on('c:mousemove', function (evt) {
            if (this._dragStart !== null) {
                var payload = {
                    event: evt,
                    delta: [
                        evt.pageX - this._dragStart[0],
                        evt.pageY - this._dragStart[1]
                    ]
                };
                if (evt.button === 0) {
                    this.trigger('c:_drag', payload);
                }
                else if (evt.button === 2) {
                    this.trigger('c:_drag.right', payload);
                }
            }
        }, this);

        return this;
    };

    /**
     * Add mouse drag controls that cause the viewpoint to change. Moving in
     * X will change theta, moving in Y will change phi.
     * @param xPhiRatio How many pixels must be dragged in x per degree change in phi.
     * @param yThetaRatio How many pixels must be dragged in y per degree change in theta..
     */
    prototype.enableDragRotation = function (params) {
        params = params || {};
        this._xPhiRatio = params.xPhiRatio || 3;
        this._yThetaRatio = params.yThetaRatio || 3;

        this._measureDrag().off('c:_drag', null, this).on('c:_drag', function (payload) {
            var dphi = payload.delta[0] / this._xPhiRatio,
                dtheta = payload.delta[1] / this._yThetaRatio,
                stepTheta = this.visModel.deltaTheta(),
                stepPhi = this.visModel.deltaPhi();

            if (Math.abs(dtheta) > stepTheta) {
                this.renderView.viewpoint.theta = this.visModel.incrementTheta(
                    this.renderView.viewpoint.theta, dtheta > 0 ? 1 : -1);
                this._dragStart = [payload.event.pageX, payload.event.pageY];
                this.renderView.showViewpoint();
            }
            else if (Math.abs(dphi) > stepPhi) {
                this.renderView.viewpoint.phi = this.visModel.incrementPhi(
                    this.renderView.viewpoint.phi, dphi > 0 ? 1 : -1);
                this._dragStart = [payload.event.pageX, payload.event.pageY];
                this.renderView.showViewpoint();
            }
        }, this);

        return this;
    };
}) ();
