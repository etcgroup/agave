<?php

function base_page($request, $page = NULL)
{
    //Set up defaults for the page template
    if (!isset($page)) {
        $page = array();
    }
    $page_defaults = array(
        'title' => 'Agave',
        'app_css' => '',
        'nav' => '',
        'app_js' => ''
    );
    foreach ($page_defaults as $key => $value) {
        if (!isset($page[$key])) {
            $page[$key] = $value;
        }
    }

    include 'templates/analytics.inc.php';

    ob_start();
    ?>
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title><?php echo $page['title']; ?></title>
        <meta name="description" content="A neat twitter visualization">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">

        <link rel="icon"
              type="image/png"
              href="<?php $request->stat('img/logo-only.png'); ?>">
        <?php echo $page['app_css']; ?>
    </head>
    <body>
    <?php
    echo $page['nav'];
    echo $page['content'];

    $flash = $request->flash();
    if ($flash) {
        ?>
        <div class="flash alert alert-<?php echo $flash['type'] ?>">
            <button type="button" class="close" data-dismiss="alert">&times;</button>
            <?php echo $flash['message'] ?>
        </div>
    <?php
    }

    if ($request->is_env('development')) {
        ?>
        <!-- Loading development resources -->
        <script src="<?php $request->stat('js/lib/require.js'); ?>"></script>
        <script src="<?php $request->stat('js/require-config.js'); ?>"></script>
        <script type="text/javascript">
            //Have to make sure that we override the common config's base url with the real one
            require.config({
                'baseUrl': "<?php $request->stat('js'); ?>"
            });
        </script>
    <?php } else { ?>
        <!-- Loading production resources -->
        <script src="//ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js"></script>
        <script src="<?php $request->stat('js/main.js'); ?>"></script>
        <script type="text/javascript">
            //A shim since jQuery didn't know about define when it initialized
            define('jquery', function () {
                return jQuery;
            });
        </script>
    <?php } ?>
    <?php
    echo $page['app_js'];
    echo google_analytics($request);
    ?>
    </body>
    </html>
    <?php
    return ob_get_clean();
}
