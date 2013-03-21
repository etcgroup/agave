define(['jquery', 'lib/d3',
    'vis/tweet_timeline'],
    function($, d3, TweetTimeline) {

        var from = 1359327600*1000;
        var to = 1359334800*1000;
        var interval = 60*2*1000;
        var min_important_rt = 1;

        var width = $('#tweetstream').width();

        (function() {
            var startExtent = [1359327600*1000, 1359334800*1000];
            var timeline = new TweetTimeline();
            timeline.width(width)
            .height(300)
            .idealBinCount(100)
//            .interpolate('step-before')
            .timeScale().domain(startExtent);

            var container = d3.select('#tweet-timeline');
            timeline.container(container)
            .render();
        })();
    });
