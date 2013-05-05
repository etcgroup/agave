define(['util/urls'],
    function (urls) {

        describe("urls utility", function () {

            function validQueryField() {
                //Get the valid fields
                var fields = urls.get_supported_query_field();
                //We'll use the first one in the test
                return fields[0];
            }

            it('can return a parser object', function () {

                var parser = urls.parse();

                expect(parser.get).toBeDefined();
                expect(parser.get_at).toBeDefined();
            });

            it('can retrieve a value by name', function () {

                var parser = urls.parse('?foo=bar&multi+word=testing');

                expect(parser.get('foo')).toEqual('bar');
                expect(parser.get('multi word')).toEqual('testing');
            });

            it('has a list of supported query field', function() {

                var fields = urls.get_supported_query_field();

                expect(fields).toBeDefined();
                expect(fields.length > 0).toBeTruthy();
            });

            it('can url encode and retrieve data', function () {
                var queryField = validQueryField();

                //Make some data
                var parameters = {
                    foo: 'bar'
                };
                var queryData = {};
                queryData[queryField] = '536';

                var url = urls.make_url(parameters, [queryData]);

                var parser = urls.parse(url);

                //Make sure the values are still there
                expect(parser.get('foo')).toEqual(parameters.foo);
                expect(parser.get_at(queryField, 0)).toEqual(queryData[queryField]);
            });

            it('returns undefined for nonexistent parameters', function() {
                var queryField = validQueryField();

                var parser = urls.parse('?i am a query string!');

                expect(parser.get('foo')).toBe(undefined);
                expect(parser.get_at(queryField, 0)).toEqual(undefined);
            });

            it('can use default values for nonexistent parameters', function() {
                var queryField = validQueryField();

                var parser = urls.parse('?i am a query string!');

                expect(parser.get('foo', 'default')).toEqual('default');
                expect(parser.get_at(queryField, 0, 'another')).toEqual('another');
            });

            it('can update the url', function() {
                spyOn(history, 'pushState');

                var parameters = {'foo': '5'};

                urls.update_url(parameters);

                expect(history.pushState).toHaveBeenCalled();
            });

        });

    });
