define(['jquery', 'lib/d3',
    'vis/tweet_timeline'],
    function($, d3, TweetTimeline) {
//        //For the SAGAwards data
//        var from = 1359327600*1000;
//        var to = 1359334800*1000;
//        var interval = 60*2*1000;
//        var min_important_rt = 1;

        //For the superbowl data
        var from = 1359934200*1000;
        var to = 1359948600*1000;
        var min_important_rt = 1;
        var utcOffsetMillis = -5 * 60 * 60 * 1000;

        var width = $('#tweetstream').width();

        (function() {
            var startExtent = [from + utcOffsetMillis, to + utcOffsetMillis];
            var timeline = new TweetTimeline();
            timeline.width(width)
            .height(300)
            .noiseThreshold(min_important_rt)
            .utcOffsetMillis(utcOffsetMillis)
            .idealBinCount(100)
//            .interpolate('step-before')
            .timeScale().domain(startExtent);

            var container = d3.select('#tweet-timeline');
            timeline.container(container)
            .render();
        })();
    });
