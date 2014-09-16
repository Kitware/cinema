(function () {
    // Flags for key modifiers for interaction
    cinema.keyModifiers = {
        CTRL: 1,
        ALT: 2,
        SHIFT: 4
    };

    /**
     * Returns whether or not the key modifiers on the event match the
     * keyModifiers state, which should be a bitwise OR of cinema.keyModifiers
     * flags.
     * @param event The event to test.
     * @param keyModifiers The state to test again.
     * @return Boolean
     */
    var _testKeyModifiers = function (event, keyModifiers) {
        /*jshint -W016 */
        return event.ctrlKey === Boolean(keyModifiers & cinema.keyModifiers.CTRL) &&
            event.altKey === Boolean(keyModifiers & cinema.keyModifiers.ALT) &&
            event.shiftKey === Boolean(keyModifiers & cinema.keyModifiers.SHIFT);
    };

    /**
     * The RenderViewInteractor is used to bind interactor functionality onto
     * an underlying render view that fires primitive mouse events.
     * The enable* methods of this class are idempotent, but can be used to
     * adjust the parameters of interaction at runtime.
     */
    cinema.utilities.RenderViewMouseInteractor = function (params) {
        this.renderView = params.renderView;
        this.camera = params.camera;

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

            var zoomLevel = this.camera.get('zoom'),
                newZoom = zoomLevel + zoomInc;
            if (newZoom <= this._maxZoomLevel && newZoom >= this._minZoomLevel) {
                this.camera.set('zoom', newZoom);
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
            this._dragStart = [evt.clientX, evt.clientY];

            // Attach mousemove to document rather than the element
            // so that dragging continues over other elements, outside
            // of the browser window, etc.
            $(document)
                .off('.renderview')
                .on('mousemove.renderview',
                    function (evt) {
                        var payload = {
                            event: evt,
                            delta: [
                                evt.clientX - this._dragStart[0],
                                evt.clientY - this._dragStart[1]
                            ]
                        };

                        // prevent text selection while dragging
                        evt.preventDefault();

                        if (evt.button === 0) {
                            this.trigger('c:_drag', payload);
                        }
                        else if (evt.button === 2) {
                            this.trigger('c:_drag.right', payload);
                        }
                    }.bind(this)
                )
                .on('mouseup.renderview',
                    function () {
                        this._dragStart = null;
                        $(document).off('.renderview');
                    }.bind(this)
                );

        }, this);

        return this;
    };

    /**
     * Add mouse drag controls that cause the viewpoint to change. Moving in
     * X will change theta, moving in Y will change phi.
     * @param xPhiRatio How many pixels must be dragged in x per degree change in phi.
     * @param yThetaRatio How many pixels must be dragged in y per degree change in theta.
     * @param keyModifiers Bitwise OR of cinema.keyModifiers, or a falsy value.
     */
    prototype.enableDragRotation = function (params) {
        params = params || {};
        this._xPhiRatio = params.xPhiRatio || 3;
        this._yThetaRatio = params.yThetaRatio || 3;
        this._rotationKeyModifiers = params.keyModifiers || 0;

        var dragHandler = function (payload) {
            if (!_testKeyModifiers(payload.event, this._rotationKeyModifiers)) {
                return;
            }
            var dphi = payload.delta[0] / this._xPhiRatio,
                dtheta = payload.delta[1] / this._yThetaRatio,
                stepTheta = this.camera.delta('theta'),
                stepPhi = this.camera.delta('phi');

            if (Math.abs(dtheta) > stepTheta) {
                this.camera.increment('theta', dtheta > 0 ? 1 : -1);
                this._dragStart = [payload.event.clientX, payload.event.clientY];
            }
            else if (Math.abs(dphi) > stepPhi) {
                this.camera.increment('phi', dphi > 0 ? 1 : -1, true);
                this._dragStart = [payload.event.clientX, payload.event.clientY];
            }
        };

        this._measureDrag().off('c:_drag', dragHandler, this)
                           .on('c:_drag', dragHandler, this);

        return this;
    };

    /**
     * Add this to enable panning when dragging the mouse.
     * @param keyModifiers Bitwise OR of cinema.keyModifiers, or a falsy value.
     */
    prototype.enableDragPan = function (params) {
        params = params || {};
        this._panKeyModifiers = params.keyModifiers || 0;

        var dragHandler = function (payload) {
            var delta;
            if (!_testKeyModifiers(payload.event, this._panKeyModifiers)) {
                return;
            }
            delta = [
                payload.event.clientX - this._dragStart[0],
                payload.event.clientY - this._dragStart[1]
            ];
            this.camera.increment('center', delta);
            this._dragStart = [payload.event.clientX, payload.event.clientY];
        };
        this._measureDrag().off('c:_drag', dragHandler, this)
                           .on('c:_drag', dragHandler, this);

        return this;
    };
}());
