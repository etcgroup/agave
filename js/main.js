define(['app'], function(App) {

    //        //Old config for the SAGAwards data
    //        var from = 1359327600*1000;
    //        var to = 1359334800*1000;
    //        var interval = 60*2*1000;
    //        var min_important_rt = 1;

    var config = {
        defaults: {
            //Default time interval (UTC seconds) for the superbowl data set
	    from: 1273421369,
	    to: 1280894063,
            mode: 'simple',
            focus: null,
            annotations: true
        },
        //Time interval (UTC seconds) for the superbowl data set
	overview_from: 1273421369,
	overview_to: 1280894063,
        //The overview bin size in seconds
        //bin_size: 5,
        bin_size: 3600, //1 hour

        //The UTC offset for Eastern Time (during the Super Bowl)
        utc_offset_millis: -5 * 60 * 60 * 1000,

        //Time between annotation polls in millis
        annotation_poll_interval: 10000
    };

    //Start the app
    window.app = new App(config);
    window.app.start();
});