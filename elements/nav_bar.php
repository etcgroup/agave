<?php

function nav_bar()
{
    ob_start();
    ?>
    <div class="navbar row">
        <div class="navbar-inner">
            <div class="container-fluid">
                <div class="nav-main-info">
                    <a class="brand" href="#">TwitterVis</a>
                    <span class="colon">:</span>
                    <span class="title muted">Super Bowl 47</span>
                </div>
                <ul class="details">
                    <li>2/3/2013 6:30pm - 2/3/2013 10:00pm EST</li>
                    <li class="divider-vertical"></li>
                    <li>7.9 million tweets</li>
                    <li class="divider-vertical"></li>
                    <li>3.8 million authors</li>
                </ul>
                <div class="user-display hide fade">
                    <span class="welcome-message">
                        Welcome, <span class="user-name"></span>!
                    </span>
                    <a href="#" class="btn sign-out-button">Sign out</a>
                </div>
            </div>
        </div>
    </div>
    <?php
    return ob_get_clean();
}
