define(['lib/d3', 'underscore'],
    function(d3, _) {

        var Rectangle = function(options) {
            this.options = _.defaults(options, {
                thickness: 1,
                color: 'red',
                borderColor: 'blue',
                width: 400,
                height: 200,
                backgroundData: [],
                sparks: []
            });

            this.target = d3.select(this.options.target);
        };

        _.extend(Rectangle.prototype, {
            render: function() {
                var self = this;
                var backgroundData = this.options.backgroundData;
                var spark = this.options.sparks;

                var x = d3.scale.linear().range([0, this.options.width]);
                var y = d3.scale.linear().range([this.options.height, this.options.height * 0.8]);
                
                var y2 = d3.scale.linear().range([this.options.height, 0]);

//                var xAxis = d3.svg.axis().scale(x).orient('bottom');
//                var yAxis = d3.svg.axis().scale(y).orient('left');

                var area = d3.svg.area()
                .interpolate('monotone')
                .x(function(d, i) {
                    return x(d.percent)
                })
                .y0(this.options.height)
                .y1(function(d) {
                    return y(d.number);
                });

                var sparkLine = d3.svg.line()
                .x(function(d) { return 100 })
                .y(function(d, i) { return y2(i); });

                var svg = this.target.append('svg')
                .attr('width', this.options.width)
                .attr('height', this.options.height)
                .append('g');

                x.domain(d3.extent(backgroundData, function(d) {
                    return d.percent;
                }));
                y.domain([0, d3.max(backgroundData, function(d){
                    return d.number;
                })]);

                y2.domain([0, 100]);

                svg.append('path')
                .datum(backgroundData)
                .attr('class', 'area')
                .attr('d', area);

                svg.append('path')
                .datum(spark)
                .attr('class', 'spark')
                .attr('d', sparkLine);
            }
        });

        return Rectangle

    });