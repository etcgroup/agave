define(['jquery', 'components/query_controls', 'model/query'],
    function ($, QueryControls, Query) {

        describe("Query Controls View", function () {

            var ui,
                searchInput,
                authorInput,
                rtCheckbox,
                minRTInput,
                sentimentSelector,
                updateButton;

            var refreshUI = function() {
                ui = $('form.query');

                searchInput = ui.find('.query-search');
                authorInput = ui.find('.query-author');
                rtCheckbox = ui.find('.query-rt');
                minRTInput = ui.find('.query-minrt');
                sentimentSelector = ui.find('.query-sentiment');
                updateButton = ui.find('.query-update');
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
                expect(minRTInput).toHaveLength(1);
                expect(sentimentSelector).toHaveLength(1);
                expect(updateButton).toHaveLength(1);
            });

            it('applies data settings to query UI', function() {
                //All non-defaults
                var data = {
                    search: 'a search string',
                    author: '@ICanTweet',
                    rt: true,
                    min_rt: 2,
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
                expect(minRTInput).toHaveValue(data.min_rt.toString());
                expect(sentimentSelector).toHaveValue(data.sentiment.toString());
            });

            it('retrieves data settings from query UI', function() {
                var data = {
                    search: 'a search string',
                    author: '@ICanTweet',
                    rt: true,
                    min_rt: 2,
                    sentiment: 0
                };

                var query = new QueryControls({
                    into: ui
                });

                searchInput.val(data.search);
                authorInput.val(data.author);
                rtCheckbox.prop('checked', true);
                minRTInput.val(data.min_rt);
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

                spyOnEvent(query.model, 'change');


                expect('change').not.toHaveBeenTriggeredOn(query.model);

                //Change something
                searchInput.val("changing the search :)");
                searchInput.change();

                expect('change').toHaveBeenTriggeredOn(query.model);
            });

            it('prevents form submit by enter and fires change', function() {
                var query = new QueryControls({
                    into: ui
                });

                spyOnEvent(query.model, 'change');
                spyOnEvent(ui, 'submit');

                //Change something
                searchInput.val("changing the search :)");

                ui.submit();

                expect('submit').toHaveBeenPreventedOn(ui);
                expect('change').toHaveBeenTriggeredOn(query.model);
            });
        });
    });