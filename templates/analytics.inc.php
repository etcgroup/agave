<?php

/**
 * @param $request Request
 * @return string
 */
function google_analytics($request) {
    if (!$request->ga_id()) {
        return '';
    } else {
        ob_start();
        ?>
        <script type="text/javascript">
            (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
            (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
            m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
            })(window,document,'script','//www.google-analytics.com/analytics.js','ga');

            ga('create', '<?php echo $request->ga_id() ?>', '<?php echo $request->ga_domain() ?>');
            ga('send', 'pageview');
        </script>
        <?php
        return ob_get_clean();
    }
}
