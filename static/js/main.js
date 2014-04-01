define(['app'], function(App) {

    //Start the app
    window.app = new App(window.agave_config);
    window.app.start();
});