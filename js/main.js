define(['app'], function(App) {

    //        //Old config for the SAGAwards data
    //        var from = 1359327600*1000;
    //        var to = 1359334800*1000;
    //        var interval = 60*2*1000;
    //        var min_important_rt = 1;

    var config = {
        defaults: {
            //Default time interval (UTC seconds) for the superbowl data set
            from: 1359932400,
            to: 1359952200,
            mode: 'simple',
            focus: null,
            annotations: true
        },
        //Time interval (UTC seconds) for the superbowl data set
        overview_from: 1359932400,
        overview_to: 1359952200,
        //The overview bin size in seconds
        overview_bin_size: 60,

        //The UTC offset for Eastern Time (during the Super Bowl)
        utc_offset_millis: -5 * 60 * 60 * 1000
    };

    //Start the app
    window.app = new App(config);
    window.app.start();
});