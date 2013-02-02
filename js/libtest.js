define([
    'jquery',
    'lib/d3',
    'lib/bootstrap',
    'moment',
    'underscore'
    ],
    function($, d3, bootstrap, moment, _) {

        function test() {
            $('.test')
            .append('<div class="alert">This should be a Bootstrap alert! <div class="btn">Button</div></div>')
            .popover({
                title: "Bootstrap JS is working!",
                position: 'bottom'
            })
            .append("moment.js says it is: " + moment().format('MMMM Do YYYY, h:mm:ss a'));

            setTimeout(function(){
                d3.select("body").transition()
                .style("background-color", "black")
                .style("color", "white");

                d3.select(".test").append("p").text("D3 seems to be working!");
            }, 1000);

            var underscoreTest = $('<div>Testing underscore... </div>').appendTo($('.test'))
            _.each([1, 2, 3], function(item) {
                underscoreTest.append(item + ",");
            });
        }

        return {
            test: test
        };
    });