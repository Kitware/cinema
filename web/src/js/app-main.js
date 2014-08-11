/**
 * This file is imported last, and starts the standalone application.
 */
$(function () {
    new cinema.StandaloneApp({
        el: 'body',
        dataRoot: $('#c-data-root').text(),
        staticRoot: $('#c-static-root').text()
    });
});
