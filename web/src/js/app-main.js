/**
 * This file is imported last, and starts the standalone application.
 */
$(function () {
    cinema.view = new cinema.StandaloneApp({
        el: 'body',
        dataRoot: $('#c-data-root').text(),
        staticRoot: $('#c-static-root').text()
    });

    // Make empty route redirect to #view
    cinema.router.route('', 'index_redirect', function (viewType) {
        cinema.viewType = 'view';
        cinema.view.render();
    });

    cinema.router.route(':viewType', '', function (viewType) {
        cinema.viewType = viewType;
        cinema.view.render();
    });
});
