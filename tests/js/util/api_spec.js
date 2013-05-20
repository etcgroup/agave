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

            spyOnEvent(api, 'counts');

            api.request('get', 'counts');

            expect('counts').not.toHaveBeenTriggeredOn(api);

            myResponse.resolve({
                payload: 'asdf'
            });

            expect('counts').toHaveBeenTriggeredOn(api);
        });

        it('can make new kinds of requests', function() {
            var api = new API();

            //Just prevent ajax calls
            spyOn($, 'ajax').andReturn(myResponse);

            spyOnEvent(api, 'newrequest');

            var requester = function() {};

            api.register('newrequest', 'http://example.com', requester);

            expect(api.newrequest).toBe(requester);

            api.request('get', 'newrequest');

            myResponse.resolve({
                payload: 'asdf'
            });

            expect('newrequest').toHaveBeenTriggeredOn(api);

            expect($.ajax).toHaveBeenCalledWith({
                url: 'http://example.com',
                data: {},
                type: 'get',
                dataType: 'json'
            });
        });

    });

});