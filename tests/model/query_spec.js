define(['model/query'],
    function (Query) {

        describe("Query Model", function () {

            it('takes on default field values', function() {

                var q = new Query();

                expect(q.search()).toBeDefined();
                expect(q.search()).toBeFalsy();

            });

            it('allows initializing with data', function() {

                var q = new Query({
                    search: 'hello there'
                });

                expect(q.search()).toEqual('hello there');
            });

        });

    });