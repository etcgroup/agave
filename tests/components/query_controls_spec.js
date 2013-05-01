define(['jquery', 'components/query_controls', 'model/query'],
    function ($, QueryControls, Query) {

        describe("Query Controls View", function () {

            var ui,
                viewButtonGroup,
                viewButtons,
                activeViewButton,
                searchInput,
                authorInput,
                rtCheckbox,
                minRTInput,
                sentimentSelector,
                updateButton;

            var refreshUI = function() {
                ui = $('form.query');

                viewButtonGroup = ui.find('.view-buttons');
                viewButtons = viewButtonGroup.find('button');
                activeViewButton = viewButtons.filter('.active');

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

            it('applies data settings to query UI', function() {
                //All non-defaults
                var data = {
                    view: 'stacked',
                    search: 'a search string',
                    author: '@ICanTweet',
                    rt: true,
                    min_rt: 2,
                    sentiment: 'neutral'
                };

                var query = new QueryControls({
                    model: new Query(data),
                    into: ui
                });

                refreshUI();

                expect(activeViewButton).toHaveData('mode', data.view);
                expect(searchInput).toHaveValue(data.search.toString());
                expect(authorInput).toHaveValue(data.author.toString());
                expect(rtCheckbox).toBeChecked();
                expect(minRTInput).toHaveValue(data.min_rt.toString());
                expect(sentimentSelector).toHaveValue(data.sentiment.toString());
            });

            it('retrieves data settings from query UI', function() {
                var data = {
                    view: 'stacked',
                    search: 'a search string',
                    author: '@ICanTweet',
                    rt: true,
                    min_rt: 2,
                    sentiment: 'neutral'
                };

                var query = new QueryControls({
                    into: ui
                });

                //Disable all buttons
                viewButtons.removeClass('active');
                //Activate the right button
                viewButtons.filter('[data-mode=' + data.view + ']').addClass('active');

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

                //Change something
                searchInput.val("changing the search :)");

                expect('change').not.toHaveBeenTriggeredOn(query.model);

                updateButton.click();

                expect('change').toHaveBeenTriggeredOn(query.model);
            });

            it('fires a model change event on view button click', function() {
                var query = new QueryControls({
                    into: ui
                });

                spyOnEvent(query.model, 'change');

                expect('change').not.toHaveBeenTriggeredOn(query.model);

                //Change something --

                //Disable all buttons
                viewButtons.removeClass('active');
                //Activate the right button
                viewButtons.filter('[data-mode=stacked]').addClass('active');

                viewButtons.last().click();

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