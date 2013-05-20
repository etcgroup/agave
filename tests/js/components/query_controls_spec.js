define(['jquery', 'components/query_controls', 'model/query'],
    function ($, QueryControls, Query) {

        describe("Query Controls View", function () {

            var ui,
                searchInput,
                authorInput,
                rtCheckbox,
                sentimentSelector;

            var refreshUI = function() {
                ui = $('form.query');

                searchInput = ui.find('.query-search');
                authorInput = ui.find('.query-author');
                rtCheckbox = ui.find('.query-rt');
                sentimentSelector = ui.find('.query-sentiment');
            };

            beforeEach(function () {
                loadFixtures('query.html');

                refreshUI();
            });

            it('has loaded the fixture correctly', function() {
                expect(ui).toHaveLength(1);
                expect(searchInput).toHaveLength(1);
                expect(authorInput).toHaveLength(1);
                expect(rtCheckbox).toHaveLength(1);
                expect(sentimentSelector).toHaveLength(1);
            });

            it('applies data settings to query UI', function() {
                //All non-defaults
                var data = {
                    search: 'a search string',
                    author: '@ICanTweet',
                    rt: true,
                    sentiment: 0
                };

                var query = new QueryControls({
                    model: new Query(data),
                    into: ui
                });

                refreshUI();

                expect(searchInput).toHaveValue(data.search.toString());
                expect(authorInput).toHaveValue(data.author.toString());
                expect(rtCheckbox).toBeChecked();
                expect(sentimentSelector).toHaveValue(data.sentiment.toString());
            });

            it('retrieves data settings from query UI', function() {
                var data = {
                    search: 'a search string',
                    author: '@ICanTweet',
                    rt: true,
                    sentiment: 0
                };

                var query = new QueryControls({
                    into: ui
                });

                searchInput.val(data.search);
                authorInput.val(data.author);
                rtCheckbox.prop('checked', true);
                sentimentSelector.val(data.sentiment);

                //Now gather all the data
                var result = query.collectData();

                expect(result).toBeTruthy();
                expect(query.model.data).toEqual(data);
            });

            it('changes the model on update click', function() {
                var query = new QueryControls({
                    into: ui
                });

                var handler = jasmine.createSpy();
                query.model.on('change', handler);

                expect(handler).not.toHaveBeenCalled();

                //Change something
                searchInput.val("changing the search :)");
                searchInput.change();

                expect(handler).toHaveBeenCalled();
            });

            it('prevents form submit by enter and fires change', function() {
                var query = new QueryControls({
                    into: ui
                });

                var changeHandler = jasmine.createSpy();
                query.model.on('change', changeHandler);

                spyOnEvent(ui, 'submit');

                //Change something
                searchInput.val("changing the search :)");

                ui.submit();

                expect('submit').toHaveBeenPreventedOn(ui);
                expect(changeHandler).toHaveBeenCalled();
            });
        });
    });