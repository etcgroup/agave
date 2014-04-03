define(['util/api', 'jquery'], function(API, $) {

    describe('API', function() {

        var myResponse;

        beforeEach(function() {
            myResponse = $.Deferred();
        });


        it('calls requests from shorthand method', function() {
            var api = new API();

            spyOn(api, 'request');

            var params = {foo: 'bar'};

            api.discussions(params);

            expect(api.request).toHaveBeenCalledWith('get', 'discussions', {
                params: params,
                post_process: jasmine.any(Function)
            });
        });

        it('increments request ids when requests go out', function() {
            var api = new API();

            //Just prevent ajax calls
            spyOn($, 'ajax').andReturn(myResponse);

            expect(api.get_last_rid_sent('counts')).toEqual(0);
            expect(api.get_last_rid_received('counts')).toEqual(0);

            api.request('get', 'counts');

            expect(api.get_last_rid_sent('counts')).toEqual(1);
            expect(api.get_last_rid_received('counts')).toEqual(0);
        });

        it('increments request ids when requests come in', function() {
            var api = new API();

            //Just prevent ajax calls
            spyOn($, 'ajax').andReturn(myResponse);

            expect(api.get_last_rid_sent('counts')).toEqual(0);
            expect(api.get_last_rid_received('counts')).toEqual(0);

            api.request('get', 'counts');

            expect(api.get_last_rid_sent('counts')).toEqual(1);
            expect(api.get_last_rid_received('counts')).toEqual(0);

            myResponse.resolve({
                payload: 'asdf'
            });

            expect(api.get_last_rid_sent('counts')).toEqual(1);
            expect(api.get_last_rid_received('counts')).toEqual(1);
        });

        it('triggers the right event when the request is fulfilled', function() {
            var api = new API();

            //Just prevent ajax calls
            spyOn($, 'ajax').andReturn(myResponse);

            var handler = jasmine.createSpy();
            api.on('counts', handler);

            api.request('get', 'counts');

            expect(handler).not.toHaveBeenCalled();

            myResponse.resolve({
                payload: 'asdf'
            });

            expect(handler).toHaveBeenCalled();
        });

    });

});