define(['lib/d3', 'vis/rectangle', 'vis/circular'],
    function(d3, Rectangle, Circular) {

        //        var data = getBackgroundData();
        //
        //        var rect = new Rectangle({
        //            color: 'yellow',
        //            target: '#rect',
        //            backgroundData: data,
        //            sparks: getSpark()
        //        });
        //
        //        rect.render();

        d3.csv('sagawards-interval.csv', function(data) {
            var circle = new Circular({
                target: '#circular',
                data: data
            });

            circle.render();
        });

//        var circle = new Circular({
//            target: '#circular',
//            data: getTweets()
//        });
//
//        circle.render();

        function getTweets() {
            var data = [];
            var retweets;
            var sentiment;
            var engagement;
            var pP, pN;
            var pBig;

            var pP0 = 0.25;
            var pN0 = 0.25;
            var lastBigSent = 1;
            var pBig0 = 0.005;

            for (var time = 0; time < 5000; ) {
                engagement = -Math.log(Math.random()) / 0.05;

                if (engagement > 10) {
                    pBig = pBig0;
                } else {
                    pBig = pBig0;
                }

                time += -Math.log(Math.random());

                if (Math.random() < pBig) {
                    retweets = -Math.log(Math.random()) / 0.01;
                    sentiment = Math.round(Math.random() * 2)
                    lastBigSent = sentiment;
                } else {
                    retweets = 0;
                    if (lastBigSent == 2) {
                        //Positive
                        pP = pP0 * 2;
                        pN = pN0 / 2;
                    } else if (lastBigSent == 0) {
                        //Negative
                        pP = pP0 / 2;
                        pN = pN0 * 2;
                    } else {
                        pP = pP0;
                        pN = pN0;
                    }
                    var r = Math.random();
                    if (r < pP) {
                        sentiment = 2;
                    } else if (r < pP + pN) {
                        sentiment = 0;
                    } else {
                        sentiment = 1;
                    }
                }

                data.push({
                    tweet_count: engagement,
                    rt_count: retweets,
                    sentiment: sentiment,
                    creation: time
                });
            }

            return data;
        }

        function getBackgroundData() {
            var data = [];

            for (var i = 0; i < 100; i++) {
                data.push({
                    percent: i,
                    number: Math.random() * 5
                });
            }

            return data;
        }

        function getSpark() {
            var data = [];

            for (var i = 0; i < 56; i++) {
                data.push({
                    number: Math.random() * 5,
                    sentiment: Math.round(Math.random() * 2)
                });
            }

            return data;
        }
    /*
        var margin = {
            top: 10,
            right: 10,
            bottom: 100,
            left: 40
        },
        margin2 = {
            top: 430,
            right: 10,
            bottom: 20,
            left: 40
        },
        width = 960 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom,
        height2 = 500 - margin2.top - margin2.bottom;

        var parseDate = d3.time.format("%b %Y").parse;

        var x = d3.time.scale().range([0, width]),
        x2 = d3.time.scale().range([0, width]),
        y = d3.scale.linear().range([height, 0]),
        y2 = d3.scale.linear().range([height2, 0]);

        var xAxis = d3.svg.axis().scale(x).orient("bottom"),
        xAxis2 = d3.svg.axis().scale(x2).orient("bottom"),
        yAxis = d3.svg.axis().scale(y).orient("left");

        var brush = d3.svg.brush()
        .x(x2)
        .on("brush", brush);

        var area = d3.svg.area()
        .interpolate("monotone")
        .x(function(d) {
            return x(d.date);
        })
        .y0(height)
        .y1(function(d) {
            return y(d.price);
        });

        var area2 = d3.svg.area()
        .interpolate("monotone")
        .x(function(d) {
            return x2(d.date);
        })
        .y0(height2)
        .y1(function(d) {
            return y2(d.price);
        });

        var svg = d3.select(".test").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);

        svg.append("defs").append("clipPath")
        .attr("id", "clip")
        .append("rect")
        .attr("width", width)
        .attr("height", height);

        var focus = svg.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        var context = svg.append("g")
        .attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");

        var csvData = d3.select('#data').text();
        var dataArray = d3.csv.parse(csvData);

        (function(error, data) {
            data.forEach(function(d) {
                d.date = parseDate(d.date);
                d.price = +d.price;
            });

            x.domain(d3.extent(data.map(function(d) {
                return d.date;
            })));
            y.domain([0, d3.max(data.map(function(d) {
                return d.price;
            }))]);
            x2.domain(x.domain());
            y2.domain(y.domain());

            focus.append("path")
            .datum(data)
            .attr("clip-path", "url(#clip)")
            .attr("d", area);

            focus.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);

            focus.append("g")
            .attr("class", "y axis")
            .call(yAxis);

            context.append("path")
            .datum(data)
            .attr("d", area2);

            context.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height2 + ")")
            .call(xAxis2);

            context.append("g")
            .attr("class", "x brush")
            .call(brush)
            .selectAll("rect")
            .attr("y", -6)
            .attr("height", height2 + 7);
        })(null, dataArray);

        function brush() {
            x.domain(brush.empty() ? x2.domain() : brush.extent());
            focus.select("path").attr("d", area);
            focus.select(".x.axis").call(xAxis);
        }
*/
    });
