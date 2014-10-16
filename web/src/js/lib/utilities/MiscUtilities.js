/**
 * Use Backbone Events listenTo/stopListening with any DOM element
 *
 * @param {DOM Element}
 * @return {Backbone Events style object}
 **/
cinema.backboneEvents = function (el) {
    var args;
    return {
        on: function (event, handler) {
            if (args) {
                throw new Error("duplicate event wrapper calls");
            }
            el.addEventListener(event, handler, false);
            args = [event, handler];
        },
        off: function () {
            el.removeEventListener.apply(el, args);
        }

    };
};

/**
 * Bind a callback for window resize to a Backbone view, with an optional delay
 * to wait for the window to stop being resized before calling the callback.
 *
 * @param view The Backbone view to bind the event to. When the view is removed,
 * this handler will be automatically unbound.
 * @param handler The callback to be executed when the window is resized, or
 * after the timeout has passed when the window is done being resized.
 * @param timeout Timeout in milliseconds to wait after resize, in case the
 * window is still being resized.
 */
cinema.bindWindowResizeHandler = function (view, handler, timeout) {
    view.listenTo(cinema.backboneEvents(window), 'resize', function () {
        if (timeout && view._windowResizeTimeout) {
            window.clearTimeout(view._windowResizeTimeout);
        }
        if (timeout) {
            view._windowResizeTimeout = window.setTimeout(function () {
                handler.call(view);
            }, timeout);
        } else {
            handler.call(view);
        }
    });
};
