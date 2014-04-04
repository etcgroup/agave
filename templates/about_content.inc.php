<?php

/**
 * @param $request Request
 * @return string
 */
function about_content($request) {
    ob_start();
    ?>
    <div class="content">
        hello world!
    </div>
    <?php
    return ob_get_clean();
}

function about_javascript($request, $user_data) {
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