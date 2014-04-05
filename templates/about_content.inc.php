<?php

/**
 * @param $request Request
 * @param $router Router
 * @param $corpora array
 * @return string
 */
function about_content($request, $router, $corpora)
{
    include_once 'util/helpers.inc.php';

    ob_start();
    ?>
    <div class="content">

        <div class="container">

            <h1><img class="brand" src="<?php echo $request->stat('img/logo.png') ?>" alt="Agave"/></h1>

            <div class="row">

                <div class="span5 pull-right sidebar">

                    <h2>Open a Data Set</h2>

                    <p class="data-set-help">Data currently available in this copy of Agave:</p>
                    <ul class="item-list content-panel data-sets">
                        <?php foreach ($corpora as $corpus) { ?>
                            <li class="item clearfix">
                                <a href="<?php echo $router->route_url('vis', $corpus['id']) ?>">
                                    <span class="name"><?php echo $corpus['name'] ?></span>

                                    <div class="muted created-date">
                                        Created <?php echo Helpers::friendly_date($corpus['created']) ?>
                                    </div>
                                </a>
                            </li>
                        <?php } ?>
                    </ul>

                    <h2>About</h2>

                    <p>
                        Agave was created at the University of Washington
                        in Seattle as part of research on collaborative
                        visual analytics and social media analysis.
                        For more information, visit the
                        <a href="http://depts.washington.edu/sccl">Scientific Collaboration and Creativity Lab</a>
                        homepage.
                    </p>

                    <p>
                        Agave is open source!
                        Visit the <a href="https://github.com/etcgroup/agave" target="_blank">GitHub repository</a>
                        to see how it works, download it, and run your own copy.
                    </p>

                    <p>
                        Questions? Find a bug? Please post to the
                        <a href="https://github.com/etcgroup/agave/issues" target="_blank">issue tracker</a>
                        or <a href="http://depts.washington.edu/sccl/contact">send us an email</a>.
                    </p>
                </div>

                <div class="span7">
                    <h2>Collaborative Twitter Exploration</h2>

                    <p>
                        Agave is a tool for collaboratively searching
                        and exploring Twitter data sets.
                        With Agave, you can scan through a tweet timeline,
                        search and filter by keyword, annotate interesting events,
                        and discuss your findings with others.
                    </p>

                    <h2>Why use Agave?</h2>

                    <p>
                        Exploration is an important part of
                        any research project.
                        It can help you escape preconceived notions
                        and discover avenues for investigation
                        that are more grounded in the data.
                    </p>

                    <p>
                        Data sets from Twitter have complex dynamics and tangled relationships.
                        As data sets grow larger, it can quickly become difficult
                        to explore effectively.
                    </p>

                    <p>
                        Agave is useful for getting oriented in a new data set,
                        discovering key events, and uncovering important topics, and
                        its simple and usable web-based design makes it possible
                        for all team members to participate productively.
                    </p>

                </div>
            </div>
            <div class="row">
<!---->
<!--                <p>-->
<!--                    Agave works great on data gathered using the Twitter Streaming API-->
<!--                    over a period of hours or days, but longer time spans can also work.-->
<!--                </p>-->
            </div>
        </div>

    </div>
    <?php
    return ob_get_clean();
}

function about_javascript($request, $user_data)
{
    ob_start();
    ?>
    <script type="text/javascript">
        <?php if ($user_data) { ?>
        window.user_data = <?php echo json_encode($user_data); ?>;
        <?php } ?>

        //Start the app
        require(["about"]);
    </script>
    <?php

    return ob_get_clean();
}