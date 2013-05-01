define(['model/query'],
    function (Query) {

        describe("Query Model", function () {

            it('takes on default field values', function() {
                var query = new Query();

                expect(query.view()).toEqual('area');
                expect(query.search()).toEqual('');
                expect(query.author()).toEqual('');
                expect(query.rt()).toEqual(false);
                expect(query.sentiment()).toEqual('');
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