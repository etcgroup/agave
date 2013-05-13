define(['model/query'],
    function (Query) {

        describe("Query Model", function () {

            it('takes on default field values', function() {
                var query = new Query();

                expect(query.search()).toEqual(null);
                expect(query.author()).toEqual(null);
                expect(query.rt()).toEqual(false);
                expect(query.sentiment()).toEqual(null);
                expect(query.min_rt()).toEqual(0);

            });

            it('allows initializing with data', function() {

                var q = new Query({
                    search: 'hello there'
                });

                expect(q.search()).toEqual('hello there');
            });

        });

    });