delimiter $$

CREATE TABLE `annotations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `created` datetime NOT NULL,
  `user` varchar(150) NOT NULL,
  `label` varchar(150) NOT NULL,
  `time` datetime NOT NULL,
  `public` int(1) unsigned NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `public_time` (`public`,`time`)
) ENGINE=MyISAM AUTO_INCREMENT=68 DEFAULT CHARSET=utf8mb4$$


delimiter $$

CREATE TABLE `burst_keywords` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `mid_point` datetime NOT NULL,
  `window_size` int(11) NOT NULL,
  `before_total_words` int(11) NOT NULL,
  `after_total_words` int(11) NOT NULL,
  `term` varchar(32) NOT NULL,
  `before_count` int(11) NOT NULL,
  `after_count` int(11) NOT NULL,
  `count_delta` int(11) NOT NULL,
  `count_percent_delta` float NOT NULL,
  `before_rate` float NOT NULL,
  `after_rate` float NOT NULL,
  `rate_delta` float NOT NULL,
  `rate_percent_delta` float NOT NULL,
  `before_relevance` float NOT NULL,
  `after_relevance` float NOT NULL,
  `relevance_delta` float NOT NULL,
  `relevance_percent_delta` float NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=28539 DEFAULT CHARSET=utf8$$


delimiter $$

CREATE TABLE `conversations` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `breadth` int(11) DEFAULT NULL,
  `depth` int(11) DEFAULT NULL,
  `root_tweet` bigint(20) DEFAULT NULL,
  `tweet_count` int(11) DEFAULT NULL,
  `start` datetime DEFAULT NULL,
  `end` datetime DEFAULT NULL,
  `users_count` int(11) DEFAULT NULL,
  `retweet_count` int(11) DEFAULT NULL,
  `sentiment` float(10,9) DEFAULT NULL,
  `abs_sentiment` float DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `root_tweet` (`root_tweet`)
) ENGINE=MyISAM AUTO_INCREMENT=315221 DEFAULT CHARSET=utf8$$


delimiter $$

CREATE TABLE `discussions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `created` datetime NOT NULL,
  `public` int(1) unsigned NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `public` (`public`)
) ENGINE=MyISAM AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb4$$


delimiter $$

CREATE TABLE `hashtag_uses` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `tweet_id` bigint(20) unsigned NOT NULL,
  `hashtag_id` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `hashtag_id` (`hashtag_id`),
  KEY `tweet_id` (`tweet_id`),
  KEY `secondary` (`tweet_id`,`hashtag_id`)
) ENGINE=MyISAM AUTO_INCREMENT=6808690 DEFAULT CHARSET=utf8$$


delimiter $$

CREATE TABLE `hashtags` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `string` varchar(150) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `string` (`string`)
) ENGINE=MyISAM AUTO_INCREMENT=294782 DEFAULT CHARSET=utf8$$


delimiter $$

CREATE TABLE `instrumentation` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `time` datetime NOT NULL,
  `ip_address` varchar(45) NOT NULL,
  `action` varchar(45) NOT NULL,
  `user` varchar(150) DEFAULT NULL,
  `data` varchar(250) DEFAULT NULL,
  `ref_id` int(11) DEFAULT NULL,
  `public` int(10) unsigned NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=3723 DEFAULT CHARSET=utf8mb4$$


delimiter $$

CREATE TABLE `mentions` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `tweet_id` bigint(20) unsigned NOT NULL,
  `user_id` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `tweet_id` (`tweet_id`),
  KEY `user_id` (`user_id`)
) ENGINE=MyISAM AUTO_INCREMENT=5742381 DEFAULT CHARSET=utf8$$


delimiter $$

CREATE TABLE `messages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `discussion_id` int(11) NOT NULL,
  `created` datetime NOT NULL,
  `user` varchar(150) NOT NULL,
  `message` varchar(1000) NOT NULL,
  `view_state` varchar(1000) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `created` (`created`)
) ENGINE=MyISAM AUTO_INCREMENT=164 DEFAULT CHARSET=utf8mb4$$


delimiter $$

CREATE TABLE `tweets` (
  `id` bigint(20) unsigned NOT NULL,
  `user_id` int(10) unsigned NOT NULL,
  `created_at` datetime NOT NULL,
  `in_reply_to_status_id` bigint(20) unsigned DEFAULT NULL,
  `in_reply_to_user_id` int(11) DEFAULT NULL,
  `retweet_of_status_id` bigint(20) DEFAULT NULL,
  `text` varchar(255) CHARACTER SET utf8mb4 NOT NULL,
  `followers_count` int(11) NOT NULL,
  `friends_count` int(11) NOT NULL,
  `sentiment` int(11) DEFAULT NULL,
  `is_retweet` tinyint(1) NOT NULL,
  `is_reply` tinyint(1) NOT NULL,
  `conversation_id` int(10) unsigned DEFAULT NULL,
  `depth` int(11) unsigned DEFAULT NULL,
  `retweet_count` int(11) NOT NULL,
  `child_count` int(11) DEFAULT NULL,
  `created_at_5s` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `created_at` (`created_at`),
  KEY `is_retweet` (`is_retweet`),
  KEY `is_reply` (`is_reply`),
  KEY `conversation_id` (`conversation_id`),
  KEY `sentiment` (`sentiment`),
  KEY `retweet_count` (`retweet_count`),
  KEY `created_at_5s` (`created_at_5s`),
  KEY `filters_users` (`is_retweet`,`created_at_5s`,`user_id`),
  KEY `filters` (`is_retweet`,`created_at_5s`,`sentiment`,`retweet_count`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8$$


delimiter $$

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `screen_name` varchar(100) NOT NULL,
  `name` varchar(100) NOT NULL,
  `created_at` datetime DEFAULT NULL,
  `location` varchar(150) DEFAULT NULL,
  `utc_offset` int(11) DEFAULT NULL,
  `lang` varchar(15) DEFAULT NULL,
  `time_zone` varchar(150) DEFAULT NULL,
  `statuses_count` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8$$

delimiter $$

CREATE TABLE `sessions` (
  `id` varchar(32) NOT NULL,
  `access` INT UNSIGNED NOT NULL,
  data TEXT NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8$$

delimiter $$

CREATE TABLE `app_users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `created` datetime NOT NULL,
  `last_signed_in` datetime DEFAULT NULL,
  `twitter_id` bigint(20) unsigned NOT NULL,
  `screen_name` varchar(100) NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  `utc_offset` int(11) DEFAULT NULL,
  `time_zone` varchar(250) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_twitter_id` (`twitter_id`)
) ENGINE=MyISAM AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4$$

