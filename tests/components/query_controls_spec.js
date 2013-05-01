define(['jquery', 'components/query_controls'],
    function ($, QueryControls) {

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

            it('has default data', function() {
                var query = new QueryControls(ui);

                expect(query.data.view).toEqual('area');
                expect(query.data.search).toEqual('');
                expect(query.data.author).toEqual('');
                expect(query.data.rt).toEqual(false);
                expect(query.data.sentiment).toEqual('');
                expect(query.data.min_rt).toEqual(0);
            });

            it('extends provided data with defaults', function() {
                var data = {
                    search: 'a search string',
                    sentiment: 'negative'
                };

                var query = new QueryControls(ui, data);

                expect(query.data.search).toEqual(data.search);
                expect(query.data.sentiment).toEqual(data.sentiment);

                expect(query.data.author).toEqual('');//default
                expect(query.data.min_rt).toEqual(0);//default
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

                var query = new QueryControls(ui, data);

                refreshUI();

                expect(activeViewButton).toHaveData('mode', data.view);
                expect(searchInput).toHaveValue(data.search.toString());
                expect(authorInput).toHaveValue(data.author.toString());
                expect(rtCheckbox).toBeChecked();
                expect(minRTInput).toHaveValue(data.min_rt.toString());
                expect(sentimentSelector).toHaveValue(data.sentiment.toString());
            });

            it('retrieves data settings from query UI', function() {
                var query = new QueryControls(ui);

                var data = {
                    view: 'stacked',
                    search: 'a search string',
                    author: '@ICanTweet',
                    rt: true,
                    min_rt: 2,
                    sentiment: 'neutral'
                };

                //Disable all buttons
                viewButtons.removeClass('active');
                //Activate the right button
                viewButtons.filter('[data-mode=' + data.view + ']').addClass('active');

                searchInput.val(data.search);
                authorInput.val(data.author);
                rtCheckbox.prop('checked', true);
                minRTInput.val(data.min_rt);
                sentimentSelector.val(data.sentiment);

                var result = query.collectData();

                expect(result).toBeTruthy();
                expect(query.data).toEqual(data);
            });

            it('recognizes invalid sentiment values', function() {
                var query = new QueryControls(ui);

                //Have to add an option for this value in order to be able to set it
                sentimentSelector.append('<option value="some random crap">HAHAHA</option>');
                sentimentSelector.val('some random crap');

                var result = query.collectData();

                expect(result).toBeFalsy();
                expect(query.invalid).toBeDefined();
            });

            it('recognizes invalid view modes', function() {
                var query = new QueryControls(ui);

                activeViewButton.attr('data-mode', 'some random mode');

                var result = query.collectData();

                expect(result).toBeFalsy();
                expect(query.invalid).toBeDefined();
            });

            it('recognizes invalid min rt values', function() {
                var query = new QueryControls(ui);

                //Have to set the type to text to be able to set this value
                minRTInput.attr('type', 'text');
                minRTInput.val('not a number');
                expect(minRTInput.val()).toEqual('not a number'); // just checking

                var result = query.collectData();

                expect(result).toBeFalsy();
                expect(query.invalid).toBeDefined();
            });

            it('collects data on update click', function() {
                var query = new QueryControls(ui);

                spyOn(query, 'collectData').andReturn(true);

                expect(query.collectData).not.toHaveBeenCalled();

                updateButton.click();

                expect(query.collectData).toHaveBeenCalled();

            });

            it('fires an update event on update click', function() {
                var query = new QueryControls(ui);

                spyOnEvent(query, 'update');

                expect('update').not.toHaveBeenTriggeredOn(query);

                updateButton.click();

                expect('update').toHaveBeenTriggeredOn(query);
            });

            it('does not fire event on update click with invalid input', function() {
                var query = new QueryControls(ui);

                activeViewButton.attr('data-mode', 'some random mode');

                expect('update').not.toHaveBeenTriggeredOn(query);
            });

            it('fires a view-change event on view button click', function() {
                var query = new QueryControls(ui);

                spyOnEvent(query, 'view-change');

                expect('view-change').not.toHaveBeenTriggeredOn(query);

                viewButtons.last().click();

                expect('view-change').toHaveBeenTriggeredOn(query);
            });

            it('prevents form submit by enter and fires update', function() {
                var query = new QueryControls(ui);

                spyOnEvent(query, 'update');
                spyOnEvent(ui, 'submit');

                ui.submit();

                expect('submit').toHaveBeenPreventedOn(ui);
                expect('update').toHaveBeenTriggeredOn(query);
            });
        });
    });