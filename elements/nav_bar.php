<?php

function nav_bar()
{
    ob_start();
    ?>
    <div class="navbar navbar-static-top">
        <div class="navbar-inner">
            <a class="brand" href="#">TwitterVis</a>
            <ul class="nav">
                <li>
                    <span class="title">Super Bowl 47</span>
                </li>
                <li>
                    <span class="muted">2/3/2013 6:30pm - 2/3/2013 10:00pm EST; 7.5 million tweets, 3.9 million authors</span>
                </li>
            </ul>
        </div>
    </div>
    <?php
    return ob_get_clean();
}
